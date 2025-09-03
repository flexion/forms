import { test as base, expect } from './import-file.fixture';
import { enLocale as message } from '@flexion/forms-common';

export type AddPackageDownloadFixture = {
  formUrl: string;
};

const test = base.extend<AddPackageDownloadFixture>({
  formUrl: async ({ page, formUrl }, use) => {
    await page.goto(formUrl);

    await page.getByRole('button', { name: message.controls.addElement.textContent, exact: true }).click();
    await page
      .getByRole('button', { name: 'Page', exact: true })
      .click();
    await page
      .getByRole('link', { name: 'Untitled Page', exact: true })
      .click();

    await page.getByRole('button', { name: message.controls.addElement.textContent, exact: true }).click();

    await page
      .getByRole('button', { name: message.patterns.packageDownload.displayName })
      .click();

    await page
      .getByRole('button', { name: 'Save and Close', exact: true })
      .click();

    await page.waitForResponse((response) =>
      response.url().includes('/api/forms') && response.status() === 200,
    );

    await page
      .getByRole('link', { name: 'Preview', exact: true })
      .click();

    await use(formUrl);
  },
});

export { test, expect };
