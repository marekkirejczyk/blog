import { describe, it, expect } from "vitest";
import {
  renderNotificationHistory,
  renderSendResult,
} from "../../src/lib/subscribe/ui.js";

describe("renderNotificationHistory", () => {
  const NOW = new Date("2025-03-15T12:00:00Z");

  it("returns empty message when no history", () => {
    expect(renderNotificationHistory([], NOW)).toBe(
      '<p class="status">No notifications sent yet.</p>'
    );
  });

  it("renders a single entry with relative date and plural count", () => {
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(renderNotificationHistory([{ sent_at: twoDaysAgo, count: 5 }], NOW)).toBe(
      '<p class="history-entry">2d ago — sent to 5 subscribers</p>'
    );
  });

  it("uses singular for count of 1", () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(renderNotificationHistory([{ sent_at: threeHoursAgo, count: 1 }], NOW)).toBe(
      '<p class="history-entry">3h ago — sent to 1 subscriber</p>'
    );
  });

  it("renders multiple entries in input order", () => {
    const oneDayAgo = new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const fourDaysAgo = new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      renderNotificationHistory(
        [
          { sent_at: oneDayAgo, count: 3 },
          { sent_at: fourDaysAgo, count: 7 },
        ],
        NOW
      )
    ).toBe(
      '<p class="history-entry">1d ago — sent to 3 subscribers</p>' +
        '<p class="history-entry">4d ago — sent to 7 subscribers</p>'
    );
  });
});

describe("renderSendResult", () => {
  it("renders plural", () => {
    expect(renderSendResult(5)).toBe("Sent to 5 subscribers.");
  });

  it("renders singular", () => {
    expect(renderSendResult(1)).toBe("Sent to 1 subscriber.");
  });

  it("renders zero as plural", () => {
    expect(renderSendResult(0)).toBe("Sent to 0 subscribers.");
  });
});
