import { expect, test, type Page } from "@playwright/test";

const sessionId = process.env.E2E_SESSION_ID;
const facilityId = process.env.E2E_FACILITY_ID;
const courtId = process.env.E2E_COURT_ID;
const playerEmail = process.env.E2E_PLAYER_EMAIL;
const playerPassword = process.env.E2E_PLAYER_PASSWORD;
const secondPlayerEmail = process.env.E2E_SECOND_PLAYER_EMAIL;
const secondPlayerPassword = process.env.E2E_SECOND_PLAYER_PASSWORD;
const staffEmail = process.env.E2E_STAFF_EMAIL;
const staffPassword = process.env.E2E_STAFF_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const hasTestProject = Boolean(
  process.env.E2E_SUPABASE_URL &&
    process.env.E2E_SUPABASE_PUBLISHABLE_KEY,
);
const hasPlayerFixture = Boolean(
  hasTestProject && sessionId && playerEmail && playerPassword,
);
const hasTwoPlayerFixture = Boolean(
  hasPlayerFixture &&
    secondPlayerEmail &&
    secondPlayerPassword,
);
const hasStaffFixture = Boolean(
  hasTestProject && facilityId && staffEmail && staffPassword,
);
const hasAdminFixture = Boolean(
  hasTestProject && facilityId && adminEmail && adminPassword,
);
const hasMatchFixture = Boolean(
  hasPlayerFixture &&
    hasStaffFixture &&
    courtId &&
    secondPlayerEmail &&
    secondPlayerPassword,
);

function requiredFixture(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required E2E fixture value: ${name}`);
  }
  return value;
}

async function signIn(
  page: Page,
  email: string,
  password: string,
  nextPath: string,
): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

async function joinQueue(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Join queue" }).click();
  await expect(page.getByRole("button", { name: "Leave queue" })).toBeVisible();
}

async function leaveQueueIfPresent(page: Page): Promise<void> {
  const leaveButton = page.getByRole("button", { name: "Leave queue" });
  if (await leaveButton.count()) {
    await leaveButton.click();
    await expect(leaveButton).toHaveCount(0);
  }
}

test("player can join and leave a session queue", async ({ page }) => {
  test.skip(!hasPlayerFixture, "Configure an isolated E2E player and open session.");

  await page.setViewportSize({ width: 390, height: 844 });
  const sessionPath = `/sessions/${requiredFixture(sessionId, "E2E_SESSION_ID")}`;
  await signIn(
    page,
    requiredFixture(playerEmail, "E2E_PLAYER_EMAIL"),
    requiredFixture(playerPassword, "E2E_PLAYER_PASSWORD"),
    sessionPath,
  );
  await expect(page.getByRole("heading", { name: "Session queue" })).toBeVisible();
  await joinQueue(page);

  await page.getByRole("button", { name: "Leave queue" }).click();
  await expect(page.getByText("You left this queue.")).toBeVisible();
});

test("concurrent joins by one player leave only one active queue entry", async ({
  browser,
}) => {
  test.skip(!hasPlayerFixture, "Configure an isolated E2E player and open session.");

  const firstPage = await browser.newPage();
  const secondPage = await browser.newPage();
  const sessionPath = `/sessions/${requiredFixture(sessionId, "E2E_SESSION_ID")}`;
  const email = requiredFixture(playerEmail, "E2E_PLAYER_EMAIL");
  const password = requiredFixture(playerPassword, "E2E_PLAYER_PASSWORD");

  try {
    await Promise.all([
      signIn(firstPage, email, password, sessionPath),
      signIn(secondPage, email, password, sessionPath),
    ]);

    const firstJoin = firstPage.getByRole("button", { name: "Join queue" });
    const secondJoin = secondPage.getByRole("button", { name: "Join queue" });
    await expect(firstJoin).toBeVisible();
    await expect(secondJoin).toBeVisible();
    const initialCountText = await firstPage
      .getByText(/^\d+ waiting$/)
      .textContent();
    const initialCount = Number(initialCountText?.match(/^(\d+)/)?.[1]);
    expect(Number.isInteger(initialCount)).toBe(true);
    await Promise.all([firstJoin.click(), secondJoin.click()]);

    await firstPage.reload();
    await expect(firstPage.getByRole("button", { name: "Leave queue" })).toBeVisible();
    await expect(firstPage.getByText(/^\d+ waiting$/)).toHaveText(
      `${initialCount + 1} waiting`,
    );
  } finally {
    await leaveQueueIfPresent(firstPage);
    await firstPage.close();
    await secondPage.close();
  }
});

test("queue changes reach another connected browser", async ({ browser }) => {
  test.skip(
    !hasTwoPlayerFixture,
    "Configure two isolated E2E player accounts and an open session.",
  );

  const firstPage = await browser.newPage();
  const secondPage = await browser.newPage();
  const sessionPath = `/sessions/${requiredFixture(sessionId, "E2E_SESSION_ID")}`;

  try {
    await Promise.all([
      signIn(
        firstPage,
        requiredFixture(playerEmail, "E2E_PLAYER_EMAIL"),
        requiredFixture(playerPassword, "E2E_PLAYER_PASSWORD"),
        sessionPath,
      ),
      signIn(
        secondPage,
        requiredFixture(secondPlayerEmail, "E2E_SECOND_PLAYER_EMAIL"),
        requiredFixture(secondPlayerPassword, "E2E_SECOND_PLAYER_PASSWORD"),
        sessionPath,
      ),
    ]);

    const liveStatus = secondPage
      .getByRole("status")
      .filter({ hasText: /Live updates/ });
    await expect(liveStatus).toContainText("Live updates connected");
    const initialCountText = await secondPage
      .getByText(/^\d+ waiting$/)
      .textContent();
    const initialCount = Number(initialCountText?.match(/^(\d+)/)?.[1]);
    expect(Number.isInteger(initialCount)).toBe(true);

    await joinQueue(firstPage);
    await expect(secondPage.getByText(/^\d+ waiting$/)).toHaveText(
      `${initialCount + 1} waiting`,
    );
  } finally {
    await leaveQueueIfPresent(firstPage);
    await firstPage.close();
    await secondPage.close();
  }
});

test("a player is denied facility management access", async ({ page }) => {
  test.skip(
    !(hasPlayerFixture && facilityId),
    "Configure an isolated E2E player and facility.",
  );

  await signIn(
    page,
    requiredFixture(playerEmail, "E2E_PLAYER_EMAIL"),
    requiredFixture(playerPassword, "E2E_PLAYER_PASSWORD"),
    `/management/${requiredFixture(facilityId, "E2E_FACILITY_ID")}`,
  );
  await expect(page).toHaveURL(/\/player\?reason=forbidden/);
  await expect(
    page.getByText("You do not have staff or administrator access to that facility."),
  ).toBeVisible();
});

test("facility administrator can access configuration controls", async ({
  page,
}) => {
  test.skip(
    !hasAdminFixture,
    "Configure an isolated E2E facility administrator account.",
  );

  await signIn(
    page,
    requiredFixture(adminEmail, "E2E_ADMIN_EMAIL"),
    requiredFixture(adminPassword, "E2E_ADMIN_PASSWORD"),
    `/management/${requiredFixture(facilityId, "E2E_FACILITY_ID")}`,
  );
  await expect(page.getByRole("button", { name: "Save facility" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add court" })).toBeVisible();
});

test("facility administrator sees their own court on the player home", async ({
  page,
}) => {
  test.skip(!hasAdminFixture, "Configure an isolated E2E facility administrator account.");

  await signIn(
    page,
    requiredFixture(adminEmail, "E2E_ADMIN_EMAIL"),
    requiredFixture(adminPassword, "E2E_ADMIN_PASSWORD"),
    "/player",
  );

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/court/i);
  await expect(page.getByRole("link", { name: "Open facility" }).first()).toBeVisible();
});

test("staff assigns, starts, and completes a match", async ({ browser }) => {
  test.skip(
    !hasMatchFixture,
    "Configure two E2E players, a staff account, and a disposable open session/court.",
  );

  const playerOne = await browser.newPage();
  const playerTwo = await browser.newPage();
  const staffPage = await browser.newPage();
  const sessionPath = `/sessions/${requiredFixture(sessionId, "E2E_SESSION_ID")}`;
  const managementPath = `/management/${requiredFixture(facilityId, "E2E_FACILITY_ID")}`;

  try {
    await Promise.all([
      signIn(
        playerOne,
        requiredFixture(playerEmail, "E2E_PLAYER_EMAIL"),
        requiredFixture(playerPassword, "E2E_PLAYER_PASSWORD"),
        sessionPath,
      ),
      signIn(
        playerTwo,
        requiredFixture(secondPlayerEmail, "E2E_SECOND_PLAYER_EMAIL"),
        requiredFixture(secondPlayerPassword, "E2E_SECOND_PLAYER_PASSWORD"),
        sessionPath,
      ),
    ]);
    await joinQueue(playerOne);
    await joinQueue(playerTwo);

    await signIn(
      staffPage,
      requiredFixture(staffEmail, "E2E_STAFF_EMAIL"),
      requiredFixture(staffPassword, "E2E_STAFF_PASSWORD"),
      managementPath,
    );
    await expect(
      staffPage.getByRole("button", { name: "Save facility" }),
    ).toHaveCount(0);
    await expect(
      staffPage.getByText("Assigns the next 2 eligible players in FIFO order."),
    ).toBeVisible();
    await staffPage
      .getByLabel("Available court")
      .selectOption(requiredFixture(courtId, "E2E_COURT_ID"));
    await staffPage.getByRole("button", { name: /Assign next \d+/ }).click();
    await expect(staffPage.getByText("assigned", { exact: true })).toBeVisible();

    await staffPage.getByRole("button", { name: "Start match" }).click();
    await expect(staffPage.getByText("in progress", { exact: true })).toBeVisible();

    staffPage.once("dialog", (dialog) => dialog.accept());
    await staffPage.getByRole("button", { name: "Complete match" }).click();
    await expect(staffPage.getByText("completed", { exact: true })).toBeVisible();
  } finally {
    const cancelButton = staffPage.getByRole("button", { name: "Cancel match" });
    if (await cancelButton.count()) {
      staffPage.once("dialog", (dialog) => dialog.accept());
      await staffPage
        .getByLabel("Reason for cancelling this match")
        .fill("E2E cleanup");
      await cancelButton.click();
    }

    await leaveQueueIfPresent(playerOne);
    await leaveQueueIfPresent(playerTwo);
    await playerOne.close();
    await playerTwo.close();
    await staffPage.close();
  }
});

test("session updates reconnect and support manual refresh", async ({ page }) => {
  test.skip(!hasPlayerFixture, "Configure an isolated E2E player and open session.");

  await signIn(
    page,
    requiredFixture(playerEmail, "E2E_PLAYER_EMAIL"),
    requiredFixture(playerPassword, "E2E_PLAYER_PASSWORD"),
    `/sessions/${requiredFixture(sessionId, "E2E_SESSION_ID")}`,
  );
  const liveStatus = page.getByRole("status").filter({ hasText: /Live updates/ });
  await expect(liveStatus).toContainText("Live updates connected");
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(liveStatus).toContainText("Live updates connected");

  await page.context().setOffline(true);
  await expect(liveStatus).toContainText("Connection interrupted", {
    timeout: 20_000,
  });
  await page.context().setOffline(false);
  await expect(liveStatus).toContainText("Live updates connected", {
    timeout: 30_000,
  });
});
