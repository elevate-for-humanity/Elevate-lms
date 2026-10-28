export function validateTheoryAvailability(
  input: { days: unknown; startTime: unknown; endTime: unknown },
  targetMinutes: number,
  maxMinutes: number,
) {
  if (
    !Array.isArray(input.days) ||
    !input.days.length ||
    input.days.length > 7 ||
    input.days.some((day) => !Number.isInteger(day) || day < 1 || day > 7) ||
    new Set(input.days).size !== input.days.length
  )
    throw new Error('Choose valid, distinct study days.');
  const parse = (value: unknown) => {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
      throw new Error('Choose valid study times.');
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const start = parse(input.startTime),
    end = parse(input.endTime);
  const weeklyMinutes = (end - start) * input.days.length;
  if (end <= start || weeklyMinutes < targetMinutes || weeklyMinutes > Math.min(maxMinutes, 600))
    throw new Error(
      `Choose blocks totaling at least ${targetMinutes / 60} and at most ${Math.min(maxMinutes, 600) / 60} hours weekly.`,
    );
  return {
    days: [...input.days].sort((a, b) => a - b) as number[],
    startTime: input.startTime as string,
    endTime: input.endTime as string,
    weeklyMinutes,
  };
}
