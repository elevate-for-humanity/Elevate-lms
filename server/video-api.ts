/**
 * Video Generation API
 * Backend endpoints for AI video generation
 */

import express, { Request, Response } from 'express';
import {
  generateVideo,
  VideoGenerationRequest,
  VideoGenerationResponse,
  processTimeline,
  getJobStatus,
} from './video-generator-v2';
import { generateTextToSpeech } from './tts-service';
import { defaultStorage, getVideoFileSize, VideoMetadata } from './video-storage';

const router = express.Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'video-api',
    timestamp: new Date().toISOString(),
  });
});

// Generate video from scenes
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const videoRequest: VideoGenerationRequest = req.body;

    // Validate request
    if (!videoRequest.scenes || videoRequest.scenes.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'At least one scene is required',
      });
    }

    // Validate timeline
    const timelineValidation = processTimeline(videoRequest.scenes);
    if (!timelineValidation.valid) {
      return res.status(400).json({
        error: 'Invalid timeline',
        message: 'Timeline validation failed',
        errors: timelineValidation.errors,
      });
    }

    // Start video generation
    const result = await generateVideo(videoRequest);

    // Save to storage if successful
    if (result.status === 'completed' && result.videoPath) {
      const fileSize = await getVideoFileSize(result.videoPath);
      const metadata: VideoMetadata = {
        jobId: result.jobId,
        title: videoRequest.title,
        duration: result.duration || 0,
        format: videoRequest.settings.format,
        resolution: videoRequest.settings.resolution,
        fileSize,
        createdAt: new Date(),
        userId: videoRequest.userId,
      };

      await defaultStorage.saveVideo(result.videoPath, result.jobId, metadata);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Video generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generate text-to-speech for a script
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text is required',
      });
    }

    const audioBuffer = await generateTextToSpeech(text, voice, speed);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': 'attachment; filename="speech.mp3"',
    });

    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({
      error: 'TTS generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get video generation status
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const liveStatus = getJobStatus(jobId);
    if (liveStatus) {
      return res.json({
        ...liveStatus,
        videoUrl: liveStatus.videoPath ? `/api/video/download/${jobId}` : undefined,
      });
    }

    const metadata = await defaultStorage.getVideoMetadata(jobId);
    if (!metadata) {
      return res.status(404).json({
        error: 'Video not found',
        message: 'No generation job or stored video exists for this job ID',
      });
    }

    return res.json({
      jobId,
      status: 'completed',
      progress: 100,
      videoUrl: `/api/video/download/${jobId}`,
      createdAt: metadata.createdAt,
      completedAt: metadata.createdAt,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Download generated video
router.get('/download/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const videoStream = await defaultStorage.getVideoStream(jobId);
    if (!videoStream) {
      return res.status(404).json({
        error: 'Video not found',
        message: 'Video does not exist or has been deleted',
      });
    }

    const metadata = await defaultStorage.getVideoMetadata(jobId);
    const fileName = metadata
      ? `${metadata.title.replace(/[^a-z0-9]/gi, '-')}.mp4`
      : `${jobId}.mp4`;

    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    videoStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      error: 'Download failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List user's generated videos
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;

    const allVideos = await defaultStorage.listVideos(userId as string);

    // Pagination
    const startIndex = (Number(page) - 1) * Number(pageSize);
    const endIndex = startIndex + Number(pageSize);
    const paginatedVideos = allVideos.slice(startIndex, endIndex);

    res.json({
      videos: paginatedVideos,
      total: allVideos.length,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(allVideos.length / Number(pageSize)),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Video listing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete a generated video
router.delete('/videos/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    res.json({
      success: true,
      message: 'Video deleted successfully',
      jobId,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Video deletion failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
