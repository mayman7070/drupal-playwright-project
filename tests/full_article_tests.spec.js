
const { test, expect } = require('@playwright/test');
const articleData = require('./data/articles.json'); // adjust path if needed

require('dotenv').config();

const baseURL = process.env.BASE_URL || 'http://localhost:8080';
const validImage = 'tests/assets/valid-image.jpg';
const invalidImage = 'tests/assets/invalid.bmp';


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

test('Navigate to Create Article page via Content > Add content', async ({ page }) => {
  // Click Content tab
 await page.click('#toolbar-link-system-admin_content');

  // Wait for the "+ Add content" button and click it
   const addContentLink = page.getByRole('link', { name: '+Add content' });
await expect(addContentLink).toBeVisible();
await addContentLink.click();


  // Wait and click "Article" content type
  await page.waitForSelector('a[href="/node/add/article"]', { state: 'visible' });
  await page.click('a[href="/node/add/article"]');


  // Validate Article creation page is shown
  await expect(page.locator('input[name="title[0][value]"]')).toBeVisible();
});

test('Create with all valid fields', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);

 const article = articleData.create[0]; // Select the first test case

await page.fill('input[name="title[0][value]"]', article.title || '');
await page.locator('#edit-body-wrapper [contenteditable="true"]').fill(article.body || '');
await page.setInputFiles('input[type="file"]', `tests/assets/${article.image}`);
await page.fill('input[name="field_tags[target_id]"]', article.tags || '');
await page.click('input#edit-submit');

// ✅ Validate expected message
await expect(page.locator('.messages--status')).toContainText(`${article.title} ${article.expected}`);

});

test('Create with minimal required fields', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  const article = articleData.create[1]; // Select the second test case

  await page.fill('input[name="title[0][value]"]', article.title || '');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText(`${article.title} ${article.expected}`);
});

test('Missing title field', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  const article = articleData.create[0]; // Select the first test case
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill(article.body || '');
  await page.click('input#edit-submit');
  expect(await page.$eval('input[name="title[0][value]"]', el => el.validationMessage)).toBe("Please fill out this field.");
});


test('Missing body field', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  const article = articleData.create[0]; // Select the first test case
  await page.fill('input[name="title[0][value]"]', article.title || '');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText(`${article.title} ${article.expected}`);
});

test('Special characters in title', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  const article = articleData.create[2]; // Select the third test case
  await page.fill('input[name="title[0][value]"]', article.title || '');
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill(article.body || '');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText(`${article.title} ${article.expected}`);
});

test('Upload valid image file', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'With Image');
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill('Image content');
  await page.setInputFiles('input[type="file"]', validImage);
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Upload invalid image format', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Invalid Image');
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill('Bad image');
  await page.setInputFiles('input[type="file"]', invalidImage);
  const errorMessage = page.locator('.messages--error');
  await expect(errorMessage).toContainText('cannot be uploaded');
  //await page.click('input#edit-submit');


});

test('Add multiple tags', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Tagged Article');
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill('With tags');
  await page.fill('input[name="field_tags[target_id]"]', 'tagA,tagB,tagC');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Select different text formats', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'HTML Format');
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill('Using Full HTML');
  await page.selectOption('select[name="body[0][format]"]', 'full_html');
  await page.click('input#edit-submit');
  await expect(page.locator('.messages--status')).toContainText('has been created');
});

test('Submit empty form', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.click('input#edit-submit');
  expect(await page.$eval('input[name="title[0][value]"]', el => el.validationMessage)).toBe("Please fill out this field.");
});

test('Preview before save', async ({ page }) => {
  await page.goto(`${baseURL}/node/add/article`);
  await page.fill('input[name="title[0][value]"]', 'Preview Article');
  await page.locator('#edit-body-wrapper [contenteditable="true"]').fill('Preview content');
  await page.click('input#edit-preview');
  await expect(page.locator('h1')).toContainText('Preview Article');
});
