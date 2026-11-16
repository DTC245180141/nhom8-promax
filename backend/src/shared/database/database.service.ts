// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

export class DatabaseService {
  private static instance: DatabaseService;
  public db: any;

  private constructor() {
    const dbPath = path.resolve(__dirname, '../../../ulms_database.sqlite');
    this.db = new DatabaseSync(dbPath);
    this.initTables();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initTables(): void {
    // 1. Identity Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('STUDENT', 'LECTURER', 'ADMIN')),
        department TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 2. Course Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        lecturer_id TEXT NOT NULL,
        semester TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS enrollments (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        enrolled_at TEXT NOT NULL,
        UNIQUE(course_id, student_id)
      );
      CREATE TABLE IF NOT EXISTS lectures (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        file_url TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // 3. Assignment Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        deadline TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        file_url TEXT,
        submitted_text TEXT,
        submitted_at TEXT NOT NULL,
        status TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        UNIQUE(assignment_id, student_id)
      );
    `);

    // 4. Quiz Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        is_published INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        content TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_option_index INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        score REAL,
        started_at TEXT NOT NULL,
        submitted_at TEXT,
        status TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        UNIQUE(quiz_id, student_id)
      );
    `);

    // 5. Grading Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        item_type TEXT NOT NULL, -- 'QUIZ' | 'ASSIGNMENT'
        item_id TEXT NOT NULL,
        score REAL NOT NULL,
        feedback TEXT,
        graded_at TEXT NOT NULL,
        UNIQUE(student_id, item_type, item_id)
      );
    `);

    // 6. Forum Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_role TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS forum_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 7. Notification Schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);
  }
}
