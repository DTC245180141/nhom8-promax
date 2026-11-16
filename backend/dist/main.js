"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_service_1 = require("./shared/database/database.service");
const identity_controller_1 = require("./modules/identity/api/identity.controller");
const course_controller_1 = require("./modules/course/api/course.controller");
const assignment_controller_1 = require("./modules/assignment/api/assignment.controller");
const quiz_controller_1 = require("./modules/quiz/api/quiz.controller");
const grading_controller_1 = require("./modules/grading/api/grading.controller");
const forum_controller_1 = require("./modules/forum/api/forum.controller");
const notification_controller_1 = require("./modules/notification/api/notification.controller");
const seed_1 = require("./shared/database/seed");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Health check endpoint cho IT Ops / Docker
    app.get('/health', (req, res) => {
        res.json({
            status: 'UP',
            architecture: 'Modular Monolith (Ready for Evolution)',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    });
    // Mount API Routers theo từng Bounded Context độc lập
    app.use('/api/auth', identity_controller_1.identityRouter);
    app.use('/api/courses', course_controller_1.courseRouter);
    app.use('/api/assignments', assignment_controller_1.assignmentRouter);
    app.use('/api/quizzes', quiz_controller_1.quizRouter);
    app.use('/api/grades', grading_controller_1.gradingRouter);
    app.use('/api/forum', forum_controller_1.forumRouter);
    app.use('/api/notifications', notification_controller_1.notificationRouter);
    return app;
}
if (require.main === module) {
    database_service_1.DatabaseService.getInstance();
    (0, seed_1.seedDatabase)();
    const app = createApp();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 U-LMS Backend Server running on http://localhost:${PORT}`);
        console.log(`📦 Architecture: Clean Architecture + Modular Monolith`);
        console.log(`🎓 Ready to serve 2,000 -> 30,000 students!`);
        console.log(`=======================================================`);
    });
}
