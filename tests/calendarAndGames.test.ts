import { describe, expect, it } from 'vitest';
import { calendarTimeToMinutes } from '../contexts/CalendarContext';
import { moveBoard } from '../components/Game2048Widget';

describe('calendar time ordering', () => {
  it('understands voice-style times with omitted minutes', () => {
    expect(calendarTimeToMinutes('3 PM')).toBe(15 * 60);
    expect(calendarTimeToMinutes('3:30 PM')).toBe(15 * 60 + 30);
  });
});

describe('2048 directions', () => {
  const board = [
    [0, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  it('moves up toward the first row and down toward the last row', () => {
    expect(moveBoard(board, 'up').newBoard[0][0]).toBe(2);
    expect(moveBoard(board, 'down').newBoard[3][0]).toBe(2);
  });
});
