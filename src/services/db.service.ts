import sqlite from 'better-sqlite3';
import path from 'path';

const db = new sqlite(path.resolve('./db/db.sqlite3'));

function query(sql: string, params?: unknown[]) {
	return params ? db.prepare(sql).all(params) : db.prepare(sql).all();
}

function run(sql: string, params?: unknown[]) {
	return params ? db.prepare(sql).run(params) : db.prepare(sql).run();
}

export default { query, run };
