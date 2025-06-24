
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

test('Create with all valid fields', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Valid Title');
  await page.fill('textarea[name="body[0][value]"]', 'This is the article body.', { force: true });
  await page.setInputFiles('input[type="file"]', validImage);
  await page.fill('input[name="field_tags[target_id]"]', 'tag1,tag2');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Create with minimal required fields', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Minimal Title');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Missing title field', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('textarea[name="body[0][value]"]', 'Body only', { force: true });
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--error')).toBeVisible();
});

test('Missing body field', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Title only');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Special characters in title', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', '!@#$%^&*()');
  await page.fill('textarea[name="body[0][value]"]', 'Body with special title', { force: true });
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Upload valid image file', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'With Image');
  await page.fill('textarea[name="body[0][value]"]', 'Image content', { force: true });
  await page.setInputFiles('input[type="file"]', validImage);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Upload invalid image format', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Invalid Image');
  await page.fill('textarea[name="body[0][value]"]', 'Bad image', { force: true });
  await page.setInputFiles('input[type="file"]', invalidImage);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--error')).toBeVisible();
});

test('Add multiple tags', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Tagged Article');
  await page.fill('textarea[name="body[0][value]"]', 'With tags', { force: true });
  await page.fill('input[name="field_tags[target_id]"]', 'tagA,tagB,tagC');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Select different text formats', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'HTML Format');
  await page.fill('textarea[name="body[0][value]"]', 'Using Full HTML', { force: true });
  await page.selectOption('select[name="body[0][format]"]', 'full_html');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Submit empty form', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--error')).toBeVisible();
});

test('Preview before save', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Preview Article');
  await page.fill('textarea[name="body[0][value]"]', 'Preview content', { force: true });
  await page.click('input#edit-preview');
  await expect(page.locator('h1')).toContainText('Preview Article');
});
