/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('llm_request_cache', table => {
    table.increments('id').primary();
    table.string('cache_key', 64).notNullable().unique();
    table.text('response_data').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('accessed_at').notNullable().defaultTo(knex.fn.now());
    table.integer('access_count').notNullable().defaultTo(1);
  });

  await knex.schema.table('llm_request_cache', table => {
    table.index('accessed_at', 'idx_llm_cache_accessed');
    table.index('created_at', 'idx_llm_cache_created');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('llm_request_cache');
}
