/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

import express from 'express';
import fetch from 'node-fetch';

class VideoGenerator {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  // Generate video script using AI
  async generateScript(topic, duration = 300) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Create a ${duration}-second video script about ${topic} for educational purposes.`,
            },
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      return {
        success: true,
        script: data.choices[0].message.content,
        duration: duration,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate video thumbnail
  async generateThumbnail(title) {
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Educational video thumbnail for: ${title}`,
          n: 1,
          size: '1024x1024',
        }),
      });

      const data = await response.json();
      return {
        success: true,
        thumbnailUrl: data.data[0].url,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create video metadata
  createVideoMetadata(title, script, thumbnailUrl) {
    return {
      id: `video_${Date.now()}`,
      title: title,
      script: script,
      thumbnail: thumbnailUrl,
      duration: this.estimateDuration(script),
      createdAt: new Date().toISOString(),
      status: 'generated',
    };
  }

  // Estimate video duration from script
  estimateDuration(script) {
    // Rough estimate: 150 words per minute
    const wordCount = script.split(' ').length;
    return Math.ceil((wordCount / 150) * 60);
  }
}

export default VideoGenerator;
