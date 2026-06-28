/**
 * Northflank Health Check Endpoint
 * 
 * This endpoint is designed for Northflank's health check system.
 * It does NOT check database connections or external services.
 * It only verifies that the Node.js process is running.
 * 
 * Configure in Northflank: Path = /api/health/northflank
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  }, { status: 200 });
}
