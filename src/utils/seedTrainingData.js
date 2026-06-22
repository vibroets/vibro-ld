// Utility to seed sample training calendar data
export const seedTrainingData = () => {
  // Sample Categories
  const sampleCategories = [
    { id: 'cat-1', name: 'Technical', createdAt: new Date().toISOString() },
    { id: 'cat-2', name: 'Soft Skills', createdAt: new Date().toISOString() },
    { id: 'cat-3', name: 'Safety', createdAt: new Date().toISOString() },
    { id: 'cat-4', name: 'Compliance', createdAt: new Date().toISOString() },
    { id: 'cat-5', name: 'Leadership', createdAt: new Date().toISOString() },
    { id: 'cat-6', name: 'Quality', createdAt: new Date().toISOString() }
  ];

  // Sample Training Types
  const sampleTrainingTypes = [
    { id: 'type-1', name: 'Classroom', createdAt: new Date().toISOString() },
    { id: 'type-2', name: 'Virtual', createdAt: new Date().toISOString() },
    { id: 'type-3', name: 'Hybrid', createdAt: new Date().toISOString() },
    { id: 'type-4', name: 'E-Learning', createdAt: new Date().toISOString() },
    { id: 'type-5', name: 'Workshop', createdAt: new Date().toISOString() },
    { id: 'type-6', name: 'Seminar', createdAt: new Date().toISOString() },
    { id: 'type-7', name: 'Webinar', createdAt: new Date().toISOString() },
    { id: 'type-8', name: 'Certification Program', createdAt: new Date().toISOString() }
  ];

  // Sample Trainers
  const sampleTrainers = [
    {
      id: 'trainer-1',
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1-555-0101',
      type: 'internal',
      department: 'IT',
      expertise: 'Technical Skills, Safety Training',
      hourlyRate: 100,
      availability: {
        monday: { available: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
        thursday: { available: true, startTime: '09:00', endTime: '17:00' },
        friday: { available: true, startTime: '09:00', endTime: '17:00' },
        saturday: { available: false, startTime: '', endTime: '' },
        sunday: { available: false, startTime: '', endTime: '' }
      },
      bio: 'Senior technical trainer with 10 years of experience',
      createdAt: new Date().toISOString()
    },
    {
      id: 'trainer-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1-555-0102',
      type: 'internal',
      department: 'HR',
      expertise: 'Soft Skills, Leadership',
      hourlyRate: 85,
      availability: {
        monday: { available: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
        thursday: { available: true, startTime: '09:00', endTime: '17:00' },
        friday: { available: true, startTime: '09:00', endTime: '17:00' },
        saturday: { available: false, startTime: '', endTime: '' },
        sunday: { available: false, startTime: '', endTime: '' }
      },
      bio: 'HR training specialist focused on leadership development',
      createdAt: new Date().toISOString()
    },
    {
      id: 'trainer-3',
      name: 'Dr. Michael Chen',
      email: 'michael.chen@external.com',
      phone: '+1-555-0103',
      type: 'external',
      department: 'Safety',
      expertise: 'Safety Training, Compliance',
      hourlyRate: 200,
      availability: {
        monday: { available: true, startTime: '10:00', endTime: '18:00' },
        tuesday: { available: true, startTime: '10:00', endTime: '18:00' },
        wednesday: { available: false, startTime: '', endTime: '' },
        thursday: { available: true, startTime: '10:00', endTime: '18:00' },
        friday: { available: true, startTime: '10:00', endTime: '18:00' },
        saturday: { available: false, startTime: '', endTime: '' },
        sunday: { available: false, startTime: '', endTime: '' }
      },
      bio: 'External safety consultant with 15 years industry experience',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Venues
  const sampleVenues = [
    {
      id: 'venue-1',
      name: 'Training Room A',
      type: 'training-room',
      location: 'Building 1, Floor 2',
      building: 'Building 1',
      floor: '2',
      capacity: 30,
      equipment: ['Projector', 'Laptop', 'Whiteboard', 'Internet', 'AC'],
      amenities: ['Refreshments', 'Parking'],
      hourlyRate: 50,
      available: true,
      description: 'Primary training room with modern equipment',
      createdAt: new Date().toISOString()
    },
    {
      id: 'venue-2',
      name: 'Conference Hall B',
      type: 'conference-room',
      location: 'Building 2, Floor 1',
      building: 'Building 2',
      floor: '1',
      capacity: 100,
      equipment: ['Projector', 'Video Conferencing', 'Sound System', 'Microphone', 'AC'],
      amenities: ['Refreshments', 'Parking', 'Catering'],
      hourlyRate: 150,
      available: true,
      description: 'Large conference hall suitable for big events',
      createdAt: new Date().toISOString()
    },
    {
      id: 'venue-3',
      name: 'Virtual Meeting Room',
      type: 'virtual',
      location: 'Online',
      building: '',
      floor: '',
      capacity: 50,
      equipment: ['Video Conferencing', 'Screen Sharing', 'Recording'],
      amenities: [],
      hourlyRate: 0,
      available: true,
      description: 'Virtual meeting room for remote training sessions',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Training Schedules
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);

  const sampleTrainings = [
    {
      id: 'training-1',
      title: 'Safety Training Certification',
      code: 'SAF-001',
      category: 'cat-3',
      trainingType: 'type-1',
      trainingTypeName: 'Classroom',
      categoryName: 'Safety',
      description: 'Comprehensive safety training for all employees',
      objectives: 'Understand workplace safety protocols',
      learningOutcomes: 'Safety certification completion',
      duration: 8,
      sessions: 1,
      startDate: nextWeek.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      timeZone: 'IST',
      recurring: false,
      repeatPattern: 'none',
      trainerId: 'trainer-1',
      trainer: 'John Smith',
      trainerType: 'internal',
      venueId: 'venue-1',
      venue: 'Training Room A',
      venueType: 'training-room',
      capacity: 30,
      department: 'Operations',
      location: 'Building 1, Floor 2',
      participants: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'training-2',
      title: 'Leadership Development Workshop',
      code: 'LDR-001',
      category: 'cat-5',
      trainingType: 'type-5',
      trainingTypeName: 'Workshop',
      categoryName: 'Leadership',
      description: 'Leadership skills development for managers',
      objectives: 'Develop leadership capabilities',
      learningOutcomes: 'Enhanced leadership skills',
      duration: 16,
      sessions: 2,
      startDate: twoWeeks.toISOString().split('T')[0],
      endDate: twoWeeks.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      timeZone: 'IST',
      recurring: false,
      repeatPattern: 'none',
      trainerId: 'trainer-2',
      trainer: 'Sarah Johnson',
      trainerType: 'internal',
      venueId: 'venue-2',
      venue: 'Conference Hall B',
      venueType: 'conference-room',
      capacity: 100,
      department: 'Management',
      location: 'Building 2, Floor 1',
      participants: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'training-3',
      title: 'Compliance Training Webinar',
      code: 'CMP-001',
      category: 'cat-4',
      trainingType: 'type-7',
      trainingTypeName: 'Webinar',
      categoryName: 'Compliance',
      description: 'Annual compliance requirements training',
      objectives: 'Understand compliance requirements',
      learningOutcomes: 'Compliance certification',
      duration: 4,
      sessions: 1,
      startDate: nextWeek.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '18:00',
      timeZone: 'IST',
      recurring: false,
      repeatPattern: 'none',
      trainerId: 'trainer-3',
      trainer: 'Dr. Michael Chen',
      trainerType: 'external',
      venueId: 'venue-3',
      venue: 'Virtual Meeting Room',
      venueType: 'virtual',
      capacity: 50,
      department: 'All Departments',
      location: 'Online',
      participants: 40,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Sample Enrollments
  const sampleEnrollments = [
    {
      id: 'enrollment-1',
      trainingId: 'training-1',
      participantId: 'user-1',
      participantName: 'Alice Williams',
      enrollmentType: 'manager',
      nominator: 'Manager Bob',
      justification: 'Required for safety compliance',
      status: 'approved',
      enrollmentDate: new Date().toISOString().split('T')[0]
    },
    {
      id: 'enrollment-2',
      trainingId: 'training-1',
      participantId: 'user-2',
      participantName: 'Bob Davis',
      enrollmentType: 'manager',
      nominator: 'Manager Alice',
      justification: 'Safety refresher required',
      status: 'approved',
      enrollmentDate: new Date().toISOString().split('T')[0]
    },
    {
      id: 'enrollment-3',
      trainingId: 'training-2',
      participantId: 'user-3',
      participantName: 'Carol Miller',
      enrollmentType: 'self',
      nominator: '',
      justification: 'Leadership skill development',
      status: 'pending',
      enrollmentDate: new Date().toISOString().split('T')[0]
    }
  ];

  // Sample Approvals
  const sampleApprovals = [
    {
      id: 'approval-1',
      type: 'training-request',
      title: 'Training Request: Safety Training Certification',
      requestedBy: 'John Smith',
      department: 'Operations',
      status: 'approved',
      currentLevel: 'manager',
      approvalLevels: ['manager', 'hr', 'management'],
      approvals: [
        { level: 'manager', approvedBy: 'Manager', approvedAt: new Date().toISOString() },
        { level: 'hr', approvedBy: 'HR Manager', approvedAt: new Date().toISOString() },
        { level: 'management', approvedBy: 'Director', approvedAt: new Date().toISOString() }
      ],
      trainingTitle: 'Safety Training Certification',
      expectedOutcome: 'Safety certification completion',
      amount: 0,
      justification: 'Required for safety compliance',
      createdAt: new Date().toISOString()
    },
    {
      id: 'approval-2',
      type: 'budget-request',
      title: 'Budget Request: Leadership Workshop',
      requestedBy: 'HR Department',
      department: 'HR',
      status: 'pending',
      currentLevel: 'hr',
      approvalLevels: ['hr', 'management'],
      approvals: [
        { level: 'hr', approvedBy: 'HR Manager', approvedAt: new Date().toISOString() }
      ],
      trainingTitle: 'Leadership Development Workshop',
      expectedOutcome: 'Enhanced leadership skills',
      amount: 5000,
      justification: 'Annual leadership development budget',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Notifications
  const sampleNotifications = [
    {
      id: 'notification-1',
      title: 'Training Created Notification',
      type: 'training-created',
      trigger: 'immediate',
      channels: ['email', 'push'],
      template: 'A new training "{training_title}" has been scheduled for {date} at {time}.',
      enabled: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notification-2',
      title: 'Training Reminder - 1 Day Before',
      type: 'reminder',
      trigger: '1-day',
      channels: ['email', 'sms'],
      template: 'Reminder: Training "{training_title}" is scheduled for tomorrow at {time}.',
      enabled: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notification-3',
      title: 'Training Reminder - 1 Hour Before',
      type: 'reminder',
      trigger: '1-hour',
      channels: ['push', 'teams'],
      template: 'Training "{training_title}" starts in 1 hour. Please join on time.',
      enabled: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Assessments
  const sampleAssessments = [
    {
      id: 'assessment-1',
      title: 'Safety Training Pre-Assessment',
      type: 'pre-assessment',
      trainingId: 'training-1',
      questions: [
        { id: 'q1', question: 'What is the first step in case of fire emergency?', options: ['Sound alarm', 'Evacuate', 'Call emergency', 'All of above'], correctAnswer: 3 },
        { id: 'q2', question: 'PPE stands for?', options: ['Personal Protective Equipment', 'Public Protection Equipment', 'Personal Protection Equipment', 'None'], correctAnswer: 0 }
      ],
      passingScore: 70,
      duration: 15,
      instructions: 'Answer all questions carefully. You need 70% to pass.',
      enabled: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'assessment-2',
      title: 'Leadership Post-Assessment',
      type: 'post-assessment',
      trainingId: 'training-2',
      questions: [
        { id: 'q1', question: 'What is situational leadership?', options: ['Adapting style', 'Command and control', 'Delegation', 'None'], correctAnswer: 0 }
      ],
      passingScore: 80,
      duration: 20,
      instructions: 'Complete the assessment to receive your leadership certification.',
      enabled: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Users (for enrollment)
  const sampleUsers = [
    {
      id: 'user-1',
      name: 'Alice Williams',
      email: 'alice.williams@company.com',
      role: 'user',
      department: 'Operations',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Bob Davis',
      email: 'bob.davis@company.com',
      role: 'user',
      department: 'Operations',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-3',
      name: 'Carol Miller',
      email: 'carol.miller@company.com',
      role: 'user',
      department: 'Management',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-4',
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      role: 'user',
      department: 'IT',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-5',
      name: 'Emma Brown',
      email: 'emma.brown@company.com',
      role: 'user',
      department: 'HR',
      createdAt: new Date().toISOString()
    }
  ];

  // Save to localStorage
  localStorage.setItem('trainingCategories', JSON.stringify(sampleCategories));
  localStorage.setItem('trainingTypes', JSON.stringify(sampleTrainingTypes));
  localStorage.setItem('trainers', JSON.stringify(sampleTrainers));
  localStorage.setItem('venues', JSON.stringify(sampleVenues));
  localStorage.setItem('trainingSchedules', JSON.stringify(sampleTrainings));
  localStorage.setItem('enrollments', JSON.stringify(sampleEnrollments));
  localStorage.setItem('approvals', JSON.stringify(sampleApprovals));
  localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
  localStorage.setItem('assessments', JSON.stringify(sampleAssessments));
  localStorage.setItem('users', JSON.stringify(sampleUsers));

  // Create attendance records for approved enrollments
  const sampleAttendances = sampleEnrollments
    .filter(e => e.status === 'approved')
    .map(enrollment => ({
      id: `attendance-${Date.now()}-${enrollment.participantId}`,
      trainingId: enrollment.trainingId,
      participantId: enrollment.participantId,
      participantName: enrollment.participantName,
      status: 'pending',
      checkInTime: null,
      checkOutTime: null,
      checkInMethod: null,
      location: sampleTrainings.find(t => t.id === enrollment.trainingId)?.location || 'N/A',
      notes: '',
      createdAt: new Date().toISOString()
    }));

  localStorage.setItem('attendances', JSON.stringify(sampleAttendances));

  return {
    categories: sampleCategories.length,
    trainingTypes: sampleTrainingTypes.length,
    trainers: sampleTrainers.length,
    venues: sampleVenues.length,
    trainings: sampleTrainings.length,
    enrollments: sampleEnrollments.length,
    approvals: sampleApprovals.length,
    notifications: sampleNotifications.length,
    assessments: sampleAssessments.length,
    attendances: sampleAttendances.length,
    users: sampleUsers.length
  };
};

export default seedTrainingData;
