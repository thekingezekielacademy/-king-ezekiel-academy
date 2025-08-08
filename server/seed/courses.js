const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
require('dotenv').config();

// Sample courses data
const sampleCourses = [
  {
    title: "Complete Web Development Bootcamp",
    description: "Master HTML, CSS, JavaScript, React, and Node.js to build modern web applications from scratch.",
    longDescription: "This comprehensive bootcamp covers everything you need to become a full-stack web developer. Start with the fundamentals of HTML and CSS, then dive into JavaScript programming. Learn React for frontend development and Node.js for backend services. Build real projects and deploy them to the web.",
    category: "web-development",
    level: "beginner",
    duration: 40,
    price: 99.99,
    originalPrice: 199.99,
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Full Stack"],
    requirements: [
      "Basic computer knowledge",
      "No programming experience required",
      "A computer with internet connection"
    ],
    learningOutcomes: [
      "Build responsive websites with HTML and CSS",
      "Create interactive web applications with JavaScript",
      "Develop modern UIs with React",
      "Build backend APIs with Node.js",
      "Deploy applications to the web"
    ],
    isPublished: true,
    isFeatured: true
  },
  {
    title: "Digital Marketing Mastery",
    description: "Learn SEO, social media marketing, email campaigns, and Google Ads to grow any business online.",
    longDescription: "Transform your business or career with comprehensive digital marketing skills. Master search engine optimization (SEO), social media marketing strategies, email marketing campaigns, and Google Ads management. Learn to analyze data and optimize campaigns for maximum ROI.",
    category: "digital-marketing",
    level: "intermediate",
    duration: 25,
    price: 79.99,
    originalPrice: 149.99,
    tags: ["SEO", "Social Media", "Email Marketing", "Google Ads", "Analytics"],
    requirements: [
      "Basic computer skills",
      "Understanding of business concepts",
      "Access to social media platforms"
    ],
    learningOutcomes: [
      "Optimize websites for search engines",
      "Create engaging social media content",
      "Design effective email marketing campaigns",
      "Manage Google Ads campaigns",
      "Analyze marketing performance data"
    ],
    isPublished: true,
    isFeatured: true
  },
  {
    title: "UI/UX Design Fundamentals",
    description: "Master user interface and user experience design principles to create beautiful, functional digital products.",
    longDescription: "Learn the fundamentals of UI/UX design including user research, wireframing, prototyping, and visual design. Use industry-standard tools like Figma and Adobe XD to create professional designs. Understand user psychology and design thinking methodologies.",
    category: "ui-ux-design",
    level: "beginner",
    duration: 30,
    price: 89.99,
    originalPrice: 179.99,
    tags: ["UI Design", "UX Design", "Figma", "Adobe XD", "Prototyping"],
    requirements: [
      "Basic computer skills",
      "Creative mindset",
      "Access to design software (free trials available)"
    ],
    learningOutcomes: [
      "Conduct user research and create personas",
      "Design wireframes and prototypes",
      "Create beautiful user interfaces",
      "Implement user experience best practices",
      "Present design work professionally"
    ],
    isPublished: true,
    isFeatured: false
  },
  {
    title: "Data Analytics with Python",
    description: "Learn Python programming and data analysis to extract insights from complex datasets and make data-driven decisions.",
    longDescription: "Master Python programming for data analysis, including pandas, numpy, matplotlib, and scikit-learn. Learn to clean, analyze, and visualize data. Build predictive models and create compelling data stories. Perfect for business analysts, researchers, and aspiring data scientists.",
    category: "data-analytics",
    level: "intermediate",
    duration: 35,
    price: 119.99,
    originalPrice: 229.99,
    tags: ["Python", "Pandas", "Data Analysis", "Visualization", "Machine Learning"],
    requirements: [
      "Basic programming knowledge",
      "Understanding of statistics",
      "Computer with Python installed"
    ],
    learningOutcomes: [
      "Write Python code for data analysis",
      "Clean and prepare datasets",
      "Create compelling data visualizations",
      "Build predictive models",
      "Present data insights effectively"
    ],
    isPublished: true,
    isFeatured: true
  },
  {
    title: "Brand Identity & Logo Design",
    description: "Create memorable brand identities, logos, and visual systems that stand out in today's competitive market.",
    longDescription: "Learn the principles of brand identity design, from concept development to final execution. Master logo design, color theory, typography, and brand guidelines creation. Use Adobe Illustrator and other design tools to create professional brand assets.",
    category: "branding",
    level: "beginner",
    duration: 20,
    price: 69.99,
    originalPrice: 139.99,
    tags: ["Logo Design", "Brand Identity", "Adobe Illustrator", "Typography", "Color Theory"],
    requirements: [
      "Basic computer skills",
      "Creative mindset",
      "Access to Adobe Illustrator (free trial available)"
    ],
    learningOutcomes: [
      "Develop brand identity concepts",
      "Create memorable logos",
      "Design brand guidelines",
      "Apply color theory effectively",
      "Present design work professionally"
    ],
    isPublished: true,
    isFeatured: false
  },
  {
    title: "Content Creation & Social Media",
    description: "Master content creation for social media platforms and build an engaged audience for your brand or business.",
    longDescription: "Learn to create compelling content for Instagram, TikTok, YouTube, and other social platforms. Master storytelling, video editing, photography, and community management. Build a content strategy that grows your audience and drives engagement.",
    category: "content-creation",
    level: "beginner",
    duration: 18,
    price: 59.99,
    originalPrice: 119.99,
    tags: ["Content Creation", "Social Media", "Video Editing", "Photography", "Storytelling"],
    requirements: [
      "Smartphone with camera",
      "Basic computer skills",
      "Access to social media platforms"
    ],
    learningOutcomes: [
      "Create engaging social media content",
      "Edit videos and photos professionally",
      "Develop content strategies",
      "Build and engage communities",
      "Analyze content performance"
    ],
    isPublished: true,
    isFeatured: false
  }
];

// Sample lessons data
const sampleLessons = [
  // Web Development Course Lessons
  {
    title: "Introduction to HTML",
    description: "Learn the basics of HTML markup language",
    content: "HTML (HyperText Markup Language) is the standard markup language for creating web pages. In this lesson, you'll learn the fundamental HTML elements and structure.",
    order: 1,
    lessonType: "video",
    estimatedTime: 15,
    difficulty: "easy"
  },
  {
    title: "CSS Styling Fundamentals",
    description: "Master CSS to style your HTML elements",
    content: "CSS (Cascading Style Sheets) is used to style and layout web pages. Learn selectors, properties, and the box model.",
    order: 2,
    lessonType: "video",
    estimatedTime: 20,
    difficulty: "easy"
  },
  {
    title: "JavaScript Basics",
    description: "Introduction to JavaScript programming",
    content: "JavaScript is a programming language that adds interactivity to web pages. Learn variables, functions, and DOM manipulation.",
    order: 3,
    lessonType: "video",
    estimatedTime: 25,
    difficulty: "medium"
  },
  // Digital Marketing Course Lessons
  {
    title: "SEO Fundamentals",
    description: "Learn search engine optimization basics",
    content: "SEO helps your website rank higher in search results. Learn keyword research, on-page optimization, and technical SEO.",
    order: 1,
    lessonType: "video",
    estimatedTime: 20,
    difficulty: "medium"
  },
  {
    title: "Social Media Strategy",
    description: "Develop effective social media marketing strategies",
    content: "Create engaging content and build communities on social media platforms. Learn platform-specific best practices.",
    order: 2,
    lessonType: "video",
    estimatedTime: 18,
    difficulty: "medium"
  }
];

async function seedCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingEzekielAcademy');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    console.log('✅ Cleared existing courses and lessons');

    // Find or create an instructor user
    let instructor = await User.findOne({ role: 'teacher' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'administrator' });
    }
    if (!instructor) {
      console.log('⚠️ No instructor found. Please create a teacher or administrator user first.');
      return;
    }

    // Create courses
    const createdCourses = [];
    for (const courseData of sampleCourses) {
      // Generate slug from title
      const slug = courseData.title.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      const course = new Course({
        ...courseData,
        slug,
        instructor: instructor._id
      });
      await course.save();
      createdCourses.push(course);
      console.log(`✅ Created course: ${course.title}`);
    }

    // Create lessons for the first two courses
    for (let i = 0; i < 2; i++) {
      const course = createdCourses[i];
      const courseLessons = sampleLessons.filter((_, index) => 
        (i === 0 && index < 3) || (i === 1 && index >= 3)
      );

      for (const lessonData of courseLessons) {
        // Generate slug from title
        const slug = lessonData.title.toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');

        const lesson = new Lesson({
          ...lessonData,
          slug,
          course: course._id,
          isPublished: true
        });
        await lesson.save();
        
        // Add lesson to course
        course.lessons.push(lesson._id);
        await course.save();
        
        console.log(`✅ Created lesson: ${lesson.title} for ${course.title}`);
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📚 Created ${createdCourses.length} courses`);
    console.log(`📖 Created ${sampleLessons.length} lessons`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedCourses();
}

module.exports = { seedCourses };
