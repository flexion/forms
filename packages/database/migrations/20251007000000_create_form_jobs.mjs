/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('form_jobs', table => {
    table.uuid('id').primary();

    // Foreign key to forms (CASCADE delete: jobs belong to forms)
    table
      .uuid('form_id')
      .notNullable()
      .references('id')
      .inTable('forms')
      .onDelete('CASCADE');

    // Job type - extensible for future operations
    table.text('job_type').notNullable();
    // Values: 'import-pdf', 'validate-schema', 'publish', 'export', etc.

    // Job status - represents operation state
    table.text('status').notNullable();
    // Values: 'pending', 'processing', 'completed', 'failed'

    // Timing information
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();

    // Error tracking
    table.text('error_message').nullable();
    table.text('error_stack').nullable();

    // Job metadata (input parameters, varies by job_type)
    // For 'import-pdf': { documentId, fileName, userId }
    // For 'publish': { targetEnvironment, publisherId }
    table.text('metadata').nullable();

    // Job result (output data, varies by job_type)
    // For 'import-pdf': { patternsAdded: 5, fieldsExtracted: 12 }
    // For 'validate': { errorsFound: 2, warningsFound: 5 }
    table.text('result').nullable();

    // Indexes for common queries
    table.index('form_id', 'idx_form_jobs_form_id');
    table.index('status', 'idx_form_jobs_status');
    table.index(['form_id', 'job_type'], 'idx_form_jobs_form_type');
    table.index('created_at', 'idx_form_jobs_created');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('form_jobs');
}
