require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const Admin = require('./models/Admin');
const Event = require('./models/Event');
const Project = require('./models/Project');

const app = express();

// I am behind a proxy (Render), trust the forwarded IP headers.
app.set('trust proxy', 1);
// ── Security Middleware ──────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/events',        require('./routes/eventRoutes'));
app.use('/api/projects',      require('./routes/projectRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Database Seeding (only seeds if collections are empty) ───
const seedDatabase = async () => {
  // Seed Admin (shubhanshu03) — only if no admin exists
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.create({ username: process.env.ADMIN_USERNAME, password: hashed });
    console.log(`✅ Admin seeded: ${process.env.ADMIN_USERNAME}`);
  }

  // Seed sample Events — only if collection is empty
  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await Event.insertMany([
      {
        title: 'Hackathon_2026',
        description: 'A_48_hour_coding_marathon_to_build_solutions_for_real_community_problems',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
        date: tomorrowStr, time: '10:00',
        venue: 'Auditorium_Block_3',
        presenter: 'Shubhanshu_Sharma',
        status: 'upcoming',
        registrationLink: 'https://google.com',
        domain: 'Tech_Team',
      },
      {
        title: 'Graph_Algorithms_Seminar',
        description: 'Deep_dive_into_advanced_graph_structures_and_shortest_path_implementations',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b',
        date: '2026-05-10', time: '14:30',
        venue: 'Seminar_Hall_A',
        presenter: 'Priya_Patel',
        status: 'completed',
        registrationLink: 'https://google.com',
        domain: 'Tech_Team',
      },
    ]);
    console.log('✅ Sample events seeded.');
  }

  // Seed sample Projects — only if collection is empty
  const projectCount = await Project.countDocuments();
  if (projectCount === 0) {
    await Project.insertMany([
      {
        title: 'C3_Platform_Hub',
        description: 'Full_stack_portal_for_managing_community_events_members_and_projects',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        domain: 'Tech_Team',
        contributors: ['Aarav_Mehta', 'Shubhanshu_Sharma'],
        technology: ['React', 'Node_js', 'MongoDB', 'Tailwind'],
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    ]);
    console.log('✅ Sample projects seeded.');
  }
};

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// connectDB will process.exit(1) on failure — server only starts if DB is live
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 C³ API running on http://localhost:${PORT}`);
  });
});
