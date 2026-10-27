import { expect, test } from "@playwright/test";

test("landing page is usable at desktop and mobile widths", async ({ page }) => {
  for (const viewport of [
    { width: 1365, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
});

test("sign-in and sign-up forms expose labelled, keyboard-accessible controls", async ({
  page,
}) => {
  await page.goto("/login");

  const email = page.getByRole("textbox", { name: "Email" });
  const password = page.getByLabel("Password");
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();

  await page.goto("/signup");
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "8");
});
