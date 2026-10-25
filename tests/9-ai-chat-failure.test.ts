import { test } from '@playwright/test';

// Mock the necessary dependencies
jest.mock('lib/ai/ai-service');
jest.mock('lib/ai/generate-course-outline-fn');

// Define the test case
test('should handle unknown AI chat failure gracefully', async () => {
  // Arrange
  const aiServiceMock = require('lib/ai/ai-service').default;
  const generateCourseOutlineFnMock = require('lib/ai/generate-course-outline-fn').default;

  // Simulate an unknown AI provider error
  aiServiceMock.mockImplementation(() => {
    throw new Error(`Unknown AI image provider: ${preferred}`);
  });

  // Act
  try {
    await openai.chat.completions.create({ model: selectedModel });
  } catch (error) {
    expect(error.message).toContain(`Unknown AI image provider: ${preferred}`);
  }
});
