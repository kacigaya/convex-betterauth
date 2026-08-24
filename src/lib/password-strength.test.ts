import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getPasswordIssues,
  getStrengthScore,
} from "./password-strength";

describe("password policy", () => {
  test("accepts a password meeting every requirement", () => {
    assert.deepEqual(getPasswordIssues("CorrectHorse1"), []);
    assert.equal(getStrengthScore("CorrectHorse1"), 4);
  });

  test("reports each unmet requirement", () => {
    assert.deepEqual(getPasswordIssues("short"), [
      "Between 8 and 128 characters",
      "At least 1 number",
      "At least 1 uppercase letter",
    ]);
  });

  test("rejects passwords longer than Better Auth allows", () => {
    const password = `A1${"a".repeat(127)}`;
    assert.equal(password.length, 129);
    assert.ok(
      getPasswordIssues(password).includes("Between 8 and 128 characters"),
    );
  });
});
