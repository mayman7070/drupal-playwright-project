
const { test, expect } = require('@playwright/test');
require('dotenv').config();

const baseURL = process.env.BASE_URL || 'http://localhost:8080';
const validImage = 'tests/assets/valid-image.jpg';
const invalidImage = 'tests/assets/invalid.bmp';
const articleId = 1;
const invalidArticleId = 99999;

async function login(page) {
  await page.goto(`${baseURL}/user/login`);
  await page.fill('input[name="name"]', process.env.DRUPAL_USERNAME);
  await page.fill('input[name="pass"]', process.env.DRUPAL_PASSWORD);
  await page.click('input#edit-submit');
}

test.beforeEach(async ({ page }) => {
  await login(page);
});
test.setTimeout(60000);

// Edit Scenarios
test('Update title and body', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.fill('input[name="title[0][value]"]', 'Updated Title');
  await page.fill('textarea[name="body[0][value]"]', 'Updated body', { force: true });
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been updated');
});

test('Change article image', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.setInputFiles('input[type="file"]', validImage);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been updated');
});

test('Add or remove tags', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.fill('input[name="field_tags[target_id]"]', 'newtag1,newtag2');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been updated');
});

test('Save and verify changes', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.fill('textarea[name="body[0][value]"]', 'Verified update.', { force: true });
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been updated');
});

test('Submit without title', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.fill('input[name="title[0][value]"]', '');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--error')).toBeVisible();
});

test('Upload unsupported image type', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.setInputFiles('input[type="file"]', invalidImage);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--error')).toBeVisible();
});

test('Change text format', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.selectOption('select[name="body[0][format]"]', 'plain_text');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been updated');
});

test('Preview before save', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await page.click('input#edit-preview');
  await expect(page.locator('h1')).toBeVisible();
});

test('Edit non-existent article', async ({ page }) => {
  await page.goto(`${baseURL}/node/${invalidArticleId}/edit`);
  await expect(page.locator('body')).toContainText(/Access denied|Page not found/);
});

test('Unauthorized user attempts to edit', async ({ page }) => {
  await page.goto(`${baseURL}/user/logout`);
  await page.goto(`${baseURL}/node/${articleId}/edit`);
  await expect(page.locator('body')).toContainText('You are not authorized');
});

// Delete Scenarios
test('Delete existing article', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/delete`);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been deleted');
});

test('Cancel deletion', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/delete`);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/node/${articleId}`));
});

test('Show deletion success message', async ({ page }) => {
  await page.goto(`${baseURL}/node/${articleId}/delete`);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been deleted');
});

test('Attempt to delete non-existent article', async ({ page }) => {
  await page.goto(`${baseURL}/node/${invalidArticleId}/delete`);
  await expect(page.locator('body')).toContainText(/Access denied|Page not found/);
});

test('Unauthorized user attempts to delete', async ({ page }) => {
  await page.goto(`${baseURL}/user/logout`);
  await page.goto(`${baseURL}/node/${articleId}/delete`);
  await expect(page.locator('body')).toContainText('You are not authorized');
});

test('Verify article removal from content list', async ({ page }) => {
  await page.goto(`${baseURL}/admin/content`);
  await expect(page.locator(`text=Updated Title`)).toHaveCount(0);
});
