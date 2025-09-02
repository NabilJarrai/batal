# Batal Application - Complete Issues List

## Overview

This document contains all issues for the Batal Football Academy Management System, including existing GitHub issues and recommended additional issues for complete requirement coverage.

---

## PHASE 1: Foundation & Setup

### 🏗️ Issue #1: Development Environment Setup

**Priority:** Critical | **Time:** 2-3 days | **Status:** Open

**Goal:** Set up complete development environment for Batal Application

**Tasks:**

- [ ] Create project structure (frontend/backend)
- [ ] Next.js + TypeScript + Tailwind CSS
- [ ] Spring Boot + Maven setup
- [ ] PostgreSQL database
- [ ] MinIO file storage
- [ ] Docker Compose configuration

**Done When:**

- [ ] Frontend & backend start successfully
- [ ] Database connected
- [ ] MinIO working
- [ ] Docker Compose runs all services

---

### 🔐 Issue #2: Authentication & Security Foundation

**Priority:** Critical | **Time:** 3-4 days | **Status:** Open

**Goal:** Implement secure authentication and authorization system with JWT (no refresh tokens - new login required when token expires)

**Tasks:**

- [ ] JWT authentication system (single token, no refresh)
- [ ] Password hashing with bcrypt
- [ ] Login/register endpoints
- [ ] Role-based access control (RBAC)
- [ ] Authentication middleware
- [ ] CORS and security headers
- [ ] Flyway database migrations

**Done When:**

- [ ] Users can register and login
- [ ] JWT tokens generated and validated (expire after session)
- [ ] Role-based access working
- [ ] Security headers configured
- [ ] Database migrations implemented with Flyway

---

## PHASE 2: Core Data Models

### 🗄️ Issue #3: Database Schema & Models

**Priority:** Critical | **Time:** 2-3 days | **Status:** Open

**Goal:** Design and implement core database schema and models

**Tasks:**

- [ ] Design database schema
- [ ] Create JPA entities (User, Group, Assessment, etc.)
- [ ] Set up database migrations
- [ ] Create TypeScript types for frontend
- [ ] Set up repositories and basic CRUD

**Done When:**

- [ ] All entities created with proper relationships
- [ ] Database migrations work
- [ ] Basic CRUD operations functional
- [ ] Frontend types match backend models

---

### 👥 Issue #4: User Management System

**Priority:** High | **Time:** 3-4 days | **Status:** Open

**Goal:** Create user profiles and management system for all user types

**Tasks:**

- [ ] Create user profiles (Player, Coach, Admin, Manager)
- [ ] Implement user registration and profile creation
- [ ] Build user management dashboard for admins
- [ ] Create user profile viewing and editing
- [ ] Implement user status management (active/inactive)

**Done When:**

- [ ] All user types can be created
- [ ] Profile information properly stored and retrieved
- [ ] Admins can manage all users
- [ ] Users can view and edit their profiles

---

## PHASE 3: Group Management

### 👨‍👩‍👧‍👦 Issue #5: Group System Implementation

**Priority:** High | **Time:** 2-3 days | **Status:** Open

**Goal:** Implement group management and automatic player assignment

**Tasks:**

- [ ] Create group entities and relationships
- [ ] Implement automatic player assignment based on age
- [ ] Build group management interface for admins
- [ ] Create coach assignment to groups
- [ ] Implement player promotion system (Development to Advanced)

**Done When:**

- [ ] Groups automatically created based on age criteria
- [ ] Players assigned to appropriate groups
- [ ] Coaches can be assigned to groups
- [ ] Player promotion functionality works

---

## PHASE 4: Assessment & Analytics

### 📊 Issue #6: Assessment Data Structure

**Priority:** High | **Time:** 3-4 days | **Status:** Open

**Goal:** Create assessment models and scoring system for all skill categories

**Tasks:**

- [ ] Create assessment models and scoring system
- [ ] Implement skill categories (Athletic, Technical, Mentality, Personality)
- [ ] Build assessment creation and editing interface
- [ ] Create assessment history tracking
- [ ] Implement assessment permissions (coaches can only assess their groups)

**Done When:**

- [ ] Assessments can be created for all skill categories
- [ ] Historical data properly stored
- [ ] Permission system working correctly
- [ ] Assessment forms are user-friendly

---

### 📈 Issue #7: Progress Tracking & Analytics

**Priority:** Medium | **Time:** 4-5 days | **Status:** Open

**Goal:** Implement progress tracking with charts and analytics

**Tasks:**

- [ ] Implement progress calculation algorithms
- [ ] Create charts and graphs for skill progression
- [ ] Build comparison tools (player vs group average)
- [ ] Create trend analysis features
- [ ] Implement data visualization components

**Done When:**

- [ ] Progress charts display correctly
- [ ] Trend analysis shows meaningful insights
- [ ] Comparison features work accurately
- [ ] Responsive charts on all devices

---

### 🖥️ Issue #15: User Interface Screens & Dashboards

**Priority:** Medium | **Time:** 2-3 days | **Status:** Open

**Goal:** Create comprehensive screen layouts for different user roles

**Tasks:**

- [ ] **Player Screen**:

  - Basic player details (name, DOB, level, group, coach, joining date)
  - Combined progress graph (all skill categories)
  - Latest assessment details with link to previous assessments
  - Individual skill development graphs since joining
  - Age-appropriate nutrition program display
  - Comments and complaints section

- [ ] **Coach Screen**:

  - List of players in assigned group(s)
  - Group navigation (if coach has multiple groups)
  - Combined group progress graphs
  - Assessment creation interface
  - Individual player assessment access

- [ ] **Manager Screen**:

  - Active/inactive player counts
  - Academy-wide progress graphs
  - Access to all player and coach screens
  - Comments and complaints review section

- [ ] **Admin Screen**:
  - User management interface
  - Group creation and management
  - Coach assignment interface
  - Player promotion tools

**Done When:**

- [ ] All screen layouts implemented with responsive design
- [ ] Role-based access properly implemented
- [ ] Navigation between screens works smoothly
- [ ] All required data displays correctly

---

## PHASE 5: Reporting & Communication

### 📄 Issue #8: Report Generation Engine

**Priority:** Medium | **Time:** 3-4 days | **Status:** Open

**Goal:** Create PDF report generation and email notification system

**Tasks:**

- [ ] Create PDF generation system
- [ ] Build report templates for different user types
- [ ] Implement email notification system
- [ ] Create report scheduling system
- [ ] Build report history and storage

**Done When:**

- [ ] PDF reports generate correctly
- [ ] Email notifications work
- [ ] Reports can be scheduled
- [ ] Report history accessible

---

### 🥗 Issue #14: Nutrition Program Management

**Priority:** Medium | **Time:** 1-2 days | **Status:** Open

**Goal:** Create and manage nutrition programs for different age groups

**Tasks:**

- [ ] Upload nutrition program documents (PDF/Word)
- [ ] Create nutrition program management system
- [ ] Assign nutrition programs to age groups:
  - Cookies nutrition program (4-6 years)
  - Dolphins nutrition program (7-10 years)
  - Tigers nutrition program (11-13 years)
  - Lions nutrition program (14-16 years)
- [ ] Display nutrition programs in player profiles
- [ ] Allow updates and versioning of nutrition documents

**Done When:**

- [ ] Nutrition programs can be uploaded and managed
- [ ] Each age group has assigned nutrition program
- [ ] Players can view their age-appropriate nutrition program
- [ ] Nutrition documents properly stored in MinIO

---

## PHASE 6: Advanced Features

### 🏟️ Issue #9: Pitch & Calendar Management

**Priority:** Medium | **Time:** 3-4 days | **Status:** Open

**Goal:** Create pitch management and calendar scheduling system

**Tasks:**

- [ ] Create pitch and zone management system
- [ ] Build calendar scheduling interface
- [ ] Implement group assignment to pitch zones
- [ ] Create vacation and off-day management
- [ ] Build weekly/monthly calendar views

**Done When:**

- [ ] Pitches and zones can be managed
- [ ] Calendar shows proper schedules
- [ ] Groups properly assigned to zones
- [ ] Vacation days respected in scheduling

---

### 💳 Issue #10: Membership Management

**Priority:** Medium | **Time:** 2-3 days | **Status:** Open

**Goal:** Create membership management system with payment tracking

**Tasks:**

- [ ] Create membership types and pricing system
- [ ] Implement payment tracking
- [ ] Build membership assignment interface
- [ ] Create payment history views
- [ ] Prepare ERPNext integration structure

**Done When:**

- [ ] Membership types can be created and managed
- [ ] Payment tracking works correctly
- [ ] Payment history accessible
- [ ] Ready for ERPNext integration

---

### 💬 Issue #11: Communication System

**Priority:** Low | **Time:** 2-3 days | **Status:** Open

**Goal:** Create communication system for comments and complaints

**Tasks:**

- [ ] Create comments and complaints system
- [ ] Build messaging interface
- [ ] Implement notification system
- [ ] Create comment moderation tools
- [ ] Build communication history

**Done When:**

- [ ] Users can submit comments/complaints
- [ ] Staff can respond to communications
- [ ] Notification system works
- [ ] Communication history maintained

---

### 📋 Issue #17: Specific Report Types Implementation

**Priority:** Low | **Time:** 1 day | **Status:** Open

**Goal:** Implement specific reporting requirements as outlined in original specification

**Tasks:**

- [ ] **Player Progress Report**:

  - Overall progress graph (all skill categories)
  - Latest assessment results
  - Downloadable PDF format
  - Email sharing capability

- [ ] **Coach Evaluation Report**:

  - Overall progress for all players in coach's groups
  - Group-level analytics and trends
  - Performance comparison across groups

- [ ] **Manager Evaluation Report**:
  - Academy-wide progress for all players
  - Data categorized by level (Development/Advanced)
  - Data categorized by age groups
  - Monthly income and player improvement metrics

**Done When:**

- [ ] All three report types generate correctly
- [ ] Reports match specified requirements exactly
- [ ] PDF downloads work properly
- [ ] Email sharing functional
- [ ] Manager reports show financial metrics

---

### ⚙️ Issue #18: Application Workflow Automation

**Priority:** Low | **Time:** 1 day | **Status:** Open

**Goal:** Implement specific workflow automation as outlined in original requirements

**Tasks:**

- [ ] **Automatic Player Assignment Workflow**:

  - Auto-assign new players to development groups based on age
  - Trigger group reassignment when age changes
  - Handle group capacity and splitting

- [ ] **Assessment Workflow**:

  - Monthly assessment reminders for coaches
  - Assessment completion tracking
  - Auto-generate assessment periods (monthly/quarterly)

- [ ] **Promotion Workflow**:

  - Admin/Manager tools for promoting players to Advanced level
  - Automatic group reassignment after promotion
  - Promotion history tracking

- [ ] **Email Notification Workflow**:

  - Monthly player reports sent to parents automatically
  - Assessment completion notifications
  - Player status change notifications

- [ ] **Data Synchronization Workflow**:
  - Player data sync with ERPNext
  - Payment status updates
  - Membership renewal reminders

**Done When:**

- [ ] All workflows execute automatically
- [ ] Manual override capabilities available
- [ ] Workflow history and logs maintained
- [ ] Error handling and retry mechanisms in place

---

## PHASE 7: Integration & Polish

### 🔗 Issue #12: ERPNext Integration

**Priority:** Low | **Time:** 3-4 days | **Status:** Open

**Goal:** Integrate with ERPNext for financial data synchronization

**Tasks:**

- [ ] Set up ERPNext API connections
- [ ] Implement real-time payment sync
- [ ] Create data synchronization services
- [ ] Build integration monitoring
- [ ] Handle sync error scenarios

**Done When:**

- [ ] ERPNext connection established
- [ ] Payment data syncs correctly
- [ ] Error handling works properly
- [ ] Monitoring shows sync status

---

### ✨ Issue #13: UI/UX Polish & Testing

**Priority:** Medium | **Time:** 2-3 days | **Status:** Open

**Goal:** Polish UI/UX and implement comprehensive testing

**Tasks:**

- [ ] Implement responsive design improvements
- [ ] Add loading states and error handling
- [ ] Create comprehensive testing suite
- [ ] Optimize performance
- [ ] Add accessibility features

**Done When:**

- [ ] Fully responsive on all devices
- [ ] Comprehensive error handling
- [ ] Good test coverage
- [ ] Performance optimized
- [ ] Accessibility compliant

---

### 🎨 Issue #16: Academy Branding & Design System

**Priority:** Low | **Time:** 1-2 days | **Status:** Open

**Goal:** Implement academy branding and visual design system

**Tasks:**

- [ ] **Design System Setup**:

  - Define Primary and Secondary color palette
  - Create brand guidelines document
  - Set up consistent typography
  - Define spacing and layout standards

- [ ] **Logo Integration**:

  - Academy logo in top-right corner of all pages
  - Responsive logo sizing
  - Proper logo positioning and spacing

- [ ] **Visual Consistency**:

  - Apply brand colors throughout application
  - Consistent button styles and hover states
  - Form input styling with brand colors
  - Loading states with brand elements

- [ ] **Academy Branding**:
  - Custom favicon with academy logo
  - Branded email templates
  - PDF report headers with logo and branding
  - Login/registration page branding

**Done When:**

- [ ] Academy logo properly displayed on all pages
- [ ] Brand colors consistently applied
- [ ] Professional, cohesive visual identity
- [ ] All branded materials (emails, PDFs) match academy identity

---

## RECOMMENDED ADDITIONAL ISSUES

### 📝 NEW Issue #19: Enhanced Profile Field Requirements

**Priority:** Medium | **Time:** 2 days | **Status:** Recommended

**Goal:** Implement detailed profile fields as specified in requirements

**Tasks:**

- [ ] **Enhanced Player Profile Fields**:

  - Parent name (required field)
  - Email address (with validation)
  - Physical address (street, city, postal code)
  - Basic foot preference (Right/Left dropdown)
  - Inactive reason (text field, required when status = inactive)

- [ ] **Enhanced Staff Profile Fields**:

  - Title field for Admin profiles
  - Title field for Manager profiles
  - Enhanced contact information validation

- [ ] **Profile Validation & Rules**:
  - Email format validation
  - Phone number format validation
  - Required field enforcement
  - Profile completeness indicators

**Done When:**

- [ ] All specified profile fields implemented
- [ ] Field validation working correctly
- [ ] Profile forms user-friendly and complete
- [ ] Data properly stored and retrieved

---

### ⚽ NEW Issue #20: Advanced Technical Skills Specification

**Priority:** Medium | **Time:** 1-2 days | **Status:** Recommended

**Goal:** Implement specific advanced technical skills as detailed in requirements

**Tasks:**

- [ ] **Advanced Level Technical Skills**:

  - Heading (aerial ability assessment)
  - 1 touch with bounce (ball control under pressure)
  - 1 touch without bounce (first touch precision)
  - Control/Wall/Control (wall pass execution)

- [ ] **Skill Assessment Interface**:

  - Advanced skill rating scales (1-10)
  - Skill-specific assessment forms
  - Progress tracking for advanced skills
  - Comparison with development level skills

- [ ] **Skill Progression System**:
  - Clear progression from Development to Advanced skills
  - Skill unlock criteria
  - Coaching recommendations for skill development

**Done When:**

- [ ] All advanced technical skills assessable
- [ ] Clear skill progression pathways
- [ ] Assessment forms intuitive for coaches
- [ ] Progress tracking shows skill development

---

### 📧 NEW Issue #21: Automated Email Report System

**Priority:** High | **Time:** 2-3 days | **Status:** Recommended

**Goal:** Implement comprehensive automated email notification system

**Tasks:**

- [ ] **Monthly Parent Reports**:

  - Automated monthly progress reports to parents
  - PDF attachment with player progress graphs
  - Personalized email content
  - Email scheduling and delivery tracking

- [ ] **Assessment Notifications**:

  - Coach reminders for pending assessments
  - Assessment completion confirmations
  - Assessment review notifications for admins

- [ ] **Player Status Notifications**:

  - Player promotion notifications (Development to Advanced)
  - Group assignment change notifications
  - Status change notifications (active/inactive)
  - Membership renewal reminders

- [ ] **Email Template Management**:
  - Branded email templates
  - Customizable email content
  - Multi-language support preparation
  - Email delivery logs and analytics

**Done When:**

- [ ] All automated emails working correctly
- [ ] Email templates branded and professional
- [ ] Delivery tracking and error handling working
- [ ] Manual override capabilities available

---

### 🍎 NEW Issue #22: Detailed Nutrition Program Implementation

**Priority:** Low | **Time:** 1 day | **Status:** Recommended

**Goal:** Implement specific nutrition programs as detailed in requirements

**Tasks:**

- [ ] **Age-Specific Nutrition Programs**:

  - Cookies nutrition program (4-6 years) - basic healthy eating
  - Dolphins nutrition program (7-10 years) - growth-focused nutrition
  - Tigers nutrition program (11-13 years) - athletic performance nutrition
  - Lions nutrition program (14-16 years) - advanced sports nutrition

- [ ] **Nutrition Program Features**:

  - Upload and version control for nutrition documents
  - PDF/Word document support
  - Nutrition program assignment based on age group
  - Progress tracking for nutrition adherence

- [ ] **Integration with Player Profiles**:
  - Display appropriate nutrition program on player dashboard
  - Nutrition progress tracking
  - Parent access to nutrition guidelines
  - Coach notes on nutrition compliance

**Done When:**

- [ ] All four nutrition programs properly defined and uploaded
- [ ] Age-based automatic assignment working
- [ ] Players and parents can access appropriate programs
- [ ] Nutrition tracking integrated with assessments

---

## ISSUE SUMMARY

**Total Issues:** 22 (18 existing + 4 recommended)

**By Priority:**

- Critical: 3 issues
- High: 4 issues
- Medium: 9 issues
- Low: 6 issues

**By Phase:**

- Phase 1: 2 issues (Foundation)
- Phase 2: 2 issues (Core Data)
- Phase 3: 1 issue (Groups)
- Phase 4: 3 issues (Assessment & Analytics)
- Phase 5: 2 issues (Reporting)
- Phase 6: 6 issues (Advanced Features)
- Phase 7: 3 issues (Integration & Polish)
- Additional: 4 issues (Enhanced Requirements)

**Estimated Total Development Time:** 45-60 days

**Dependencies Flow:**

1. Infrastructure (Issues #1-3) →
2. Users & Groups (Issues #4-5) →
3. Assessments & Analytics (Issues #6-7, #15) →
4. Reports & Features (Issues #8-14, #17-22) →
5. Integration & Polish (Issues #12-13, #16)

---

_This comprehensive issue list ensures 100% coverage of all Batal Application requirements and provides a clear roadmap for development._
