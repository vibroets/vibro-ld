# Vibro Learning & Development Software - Workflow

## System Overview
This is a Learning & Development (L&D) training management system with two interfaces:
- **Admin Interface** - For administrators to manage trainings, users, and track progress
- **User Interface** - For learners/trainees to view trainings, complete quizzes, and track certificates

---

## Workflow Flow Chart

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION START                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Check App Mode (sessionStorage) │
                    │  - 'user' → User Mode          │
                    │  - null/other → Admin Mode     │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │     ADMIN MODE    │           │     USER MODE     │
        │   (Web Interface) │           │  (Mobile/Web App) │
        └───────────────────�           └───────────────────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   Admin Login     │           │   User Login      │
        │   /admin-login    │           │   /user-login     │
        └───────────────────�           └───────────────────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │ Authenticate      │           │ Authenticate      │
        │ (Supabase/Local)  │           │ (Supabase/Local)  │
        └───────────────────┘           └───────────────────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │ Admin Dashboard   │           │ User Dashboard    │
        │ /admin-dashboard  │           │ /user-dashboard   │
        └───────────────────┘           └───────────────────┘
                    │                               │
                    ▼                               ▼
    ┌───────────────┴───────────────┐   ┌───────────────┴───────────────┐
    ▼                               ▼   ▼                               ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────────┐   │
│ Manage      │           │ Create      │           │ View Available   │   │
│ Users       │           │ Training    │           │ Trainings       │   │
│ /users      │           │ Schedules   │           │ (Calendar)      │   │
└─────────────┘           │ /training-  │           └─────────────────┘   │
                           │ calendar    │                   │           │
┌─────────────┐           └─────────────┘                   ▼           │
│ Attendance  │                   │               ┌─────────────────┐   │
│ Management  │                   ▼               │ Complete Quizzes│   │
│ /attendance-│         ┌─────────────┐           │ /quiz/:quizId   │   │
│ management  │         │ Assign      │           └─────────────────┘   │
└─────────────┘         │ Participants│                   │           │
                        │ to Training │                   ▼           │
┌─────────────┐         └─────────────┘           ┌─────────────────┐   │
│ Training    │                   │               │ View Videos     │   │
│ Analytics   │                   ▼               │ /training/:id   │   │
│ /training-  │         ┌─────────────┐           └─────────────────┘   │
│ analytics   │         │ Track       │                   │           │
└─────────────┘         │ Attendance  │                   ▼           │
                        │ Check-ins   │           ┌─────────────────┐   │
┌─────────────┐         │ /attendance-│           │ Check-in to     │   │
│ Trainer     │         │ management  │           │ Training        │   │
│ Management  │         └─────────────┘           │ (Location/QR)   │   │
│ /trainer-   │                   │               └─────────────────┘   │
│ management  │                   ▼                       │           │
└─────────────┘         ┌─────────────┐                   ▼           │
                        │ View        │           ┌─────────────────┐   │
┌─────────────┐         │ Quiz Results│           │ Get Certificate │   │
│ Venue       │         │ & Progress  │           │ /certificate/:id│   │
│ Management  │         └─────────────┘           └─────────────────┘   │
│ /venue-     │                   │                                       │
│ management  │                   └───────────────────────┬───────────────┘
└─────────────┘                                           │
                                                            ▼
                                                ┌───────────────────────┐
                                                │   DATA SYNC (Supabase) │
                                                │   - Users              │
                                                │   - Training Schedules │
                                                │   - Attendance         │
                                                │   - Quizzes            │
                                                │   - Quiz Results       │
                                                │   - Videos             │
                                                │   - Certificates       │
                                                └───────────────────────┘
                                                            │
                                                            ▼
                                                ┌───────────────────────┐
                                                │  Cross-Device Sync     │
                                                │  Desktop ↔ Mobile      │
                                                └───────────────────────┘
```

---

## Detailed Workflow

### 1. ADMIN WORKFLOW (Desktop/Web)

#### A. Authentication
- **URL:** `/admin-login`
- **Process:** 
  - Admin enters credentials (email/password)
  - System authenticates via Supabase
  - Falls back to localStorage if Supabase fails
  - On success → Redirect to Admin Dashboard

#### B. Admin Dashboard
- **URL:** `/admin-dashboard`
- **Features:**
  - Overview of training statistics
  - Quick access to all modules
  - Navigation to management sections

#### C. User Management (`/users`)
- **Process:**
  1. Admin creates new users (name, email, department, role)
  2. Users are saved to Supabase `users` table
  3. Users can be assigned to training programs
  4. User data syncs to mobile app via Supabase

#### D. Training Management (`/training-calendar`)
- **Process:**
  1. Admin creates training schedules (title, date, time, location, type)
  2. Assigns participants to training
  3. Sets training type (classroom, e-learning, workshop, etc.)
  4. Training saved to Supabase `training_schedules` table
  5. Participants can view and check-in to training on mobile

#### E. Attendance Management (`/attendance-management`)
- **Process:**
  1. Admin views all attendance records
  2. Can manually mark attendance (check-in/check-out)
  3. View attendance by date, status (present, absent, late)
  4. Attendance data syncs to Supabase

#### F. Other Admin Modules
- **Trainer Management:** Manage trainers for training sessions
- **Venue Management:** Manage training venues
- **Training Analytics:** View training completion rates, attendance stats
- **Assessment Management:** Create and manage quizzes/assessments

---

### 2. USER WORKFLOW (Mobile/Web)

#### A. Authentication
- **URL:** `/user-login`
- **Process:**
  - User enters credentials (email/password)
  - System authenticates via Supabase
  - Falls back to localStorage if Supabase fails
  - On success → Redirect to User Dashboard
  - Biometric login supported on mobile

#### B. User Dashboard
- **URL:** `/user-dashboard`
- **Features:**
  - View assigned trainings
  - View available quizzes
  - View video content
  - View certificates
  - Progress tracking

#### C. Training Calendar (`/user-training-calendar`)
- **Process:**
  1. User views calendar of assigned trainings
  2. Click on training to view details
  3. Check-in to training via:
     - GPS location verification
     - QR code scan
     - Biometric verification
  4. Attendance recorded to Supabase

#### D. Quiz Taking (`/quiz/:quizId`)
- **Process:**
  1. User accesses assigned quiz
  2. Answers questions
  3. Submit quiz
  4. Results saved to Supabase `quiz_results` table
  5. Results sync to admin dashboard

#### E. Video Viewing (`/training/:trainingId`)
- **Process:**
  1. User accesses training video
  2. Watches video content
  3. Progress tracked
  4. Completion recorded

#### F. Certificate Viewing (`/certificate/:certificateId`)
- **Process:**
  1. User earns certificate after completing training
  2. Certificate generated and saved to Supabase
  3. User can view/download certificate

---

### 3. DATA SYNC WORKFLOW

#### Supabase Integration
- **Primary Storage:** Supabase PostgreSQL database
- **Tables:**
  - `users` - User accounts
  - `admins` - Admin accounts
  - `training_schedules` - Training sessions
  - `attendances` - Attendance records
  - `quizzes` - Quiz definitions
  - `quiz_results` - Quiz completion data
  - `videos` - Video content
  - `certificates` - User certificates

#### Data Flow
```
Desktop Admin (Web)          Supabase (Cloud)           Mobile User (Web/App)
        │                           │                           │
        ├─→ Create User ────────────┼──────────────────────────→ │
        │                           │                           │
        ├─→ Create Training ────────┼──────────────────────────→ │
        │                           │                           │
        ├─→ View Attendance ←───────┼──────────────────────────┤
        │                           │                           │
        │                           │ ←─ User Login ────────────┤
        │                           │                           │
        │                           │ ←─ Check-in ───────────────┤
        │                           │                           │
        │                           │ ←─ Complete Quiz ──────────┤
        │                           │                           │
        │ ←─ Quiz Results ───────────┼───────────────────────────┤
        │                           │                           │
        │ ←─ Attendance Data ────────┼───────────────────────────┤
```

#### Fallback Mechanism
- If Supabase is unavailable, data is saved to localStorage
- When Supabase is available again, data syncs automatically
- Ensures app works offline and syncs when online

---

### 4. EXPECTED BEHAVIOR

#### Desktop Admin
1. Login as super admin: `vibro.chennai@gmail.com` / `Vibro@123`
2. Create users via User Management
3. Create training schedules via Training Calendar
4. Assign participants to training
5. View attendance and quiz results
6. Track progress and analytics

#### Mobile User
1. Open app on mobile
2. Login with credentials created by admin
3. View assigned trainings in calendar
4. Check-in to training (GPS/QR/Biometric)
5. Complete assigned quizzes
6. View training videos
7. Earn and view certificates

#### Data Sync
- User created on desktop → Available on mobile
- Training created on desktop → Visible on mobile
- Check-in on mobile → Visible on desktop
- Quiz results on mobile → Visible on desktop

---

### 5. CURRENT INTEGRATION STATUS

✅ **Completed:**
- Supabase database tables created
- Supabase service layer implemented
- DataManager with localStorage fallback
- UserLogin updated to use Supabase
- UserDashboard updated to use Supabase
- UserTrainingCalendar updated to use Supabase
- TrainingCalendar (admin) updated to use Supabase
- AttendanceManagement updated to use Supabase

⚠️ **Pending Deployment:**
- Vercel deployment with routing fix
- Testing cross-device data sync

---

### 6. TROUBLESHOOTING

If data sync is not working as expected:
1. Check Supabase project is active
2. Verify Supabase URL and anon key are correct
3. Check RLS policies allow read/write
4. Test with browser DevTools Network tab for Supabase API calls
5. Check localStorage for fallback data
6. Ensure both devices use the same Supabase project
