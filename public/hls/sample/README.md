This is a tiny sample HLS folder to demonstrate the deploy flow.

Place your HLS playlists (_.m3u8) and segments (_.ts, _.m4s, _.mp4) here (or in another folder and set HLS_SOURCE_DIR accordingly). During deploy, files are copied into dist/hls and uploaded to S3 with appropriate caching and content types.

Variables you can set before running ./deploy.sh:

- ENABLE_HLS_UPLOAD=true
- HLS_SOURCE_DIR=public/hls # where your HLS lives locally
- HLS_LOCAL_DIR=dist/hls # where it is synced into the build output
- HLS_S3_BUCKET=your-bucket # defaults to site bucket
- HLS_PREFIX=hls # prefix under the bucket
- HLS_INVALIDATION_PATHS=/hls/\*
