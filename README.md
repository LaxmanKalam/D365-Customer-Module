# D365-Customer-Module
Custom customer management module for Microsoft Dynamics 365 with extensions for customer data, workflows, and integrations.

# Dynamics 365 Customer Service Replica

## Project Overview

This project is a custom Customer Service module developed using Microsoft Dynamics 365, Dataverse, JavaScript, and C# Plugins. It extends the standard customer service experience with custom Case management, Queue handling, SLA deadline calculations, activity management, notifications, and integrated side-panel functionality.

The project uses custom Dataverse tables and client-side scripting to implement business logic, improve case-handling workflows, and provide a more integrated user experience.

## Key Features

### 1. Case Lifecycle Management

- **Activate Case:** Automatically updates the custom Case Status and Status Reason fields when the system State changes to Active, helping maintain consistent status information.
- **Cancel Case:** Displays a confirmation dialog before cancelling a Case. Updates the custom status fields and system State, then refreshes the form to reflect the changes.
- **Resolve Case:** Checks for open activities associated with a Case, including Tasks, Phone Calls, Emails, and Appointments. Displays a confirmation message, cancels open activities after confirmation, and invokes a custom Dataverse API to complete the resolution process.
- **Case Resolution Plugin:** Implements server-side resolution logic using a C# Plugin. Validates the Case record and its active state, checks the associated Customer, updates custom Case status fields, creates a Case Resolution record, and marks the Case inactive. Includes tracing and exception handling for troubleshooting.

### 2. Custom Queue Management

- **Add to Queue:** Allows users to select a custom Queue from a lookup dialog and add the current Case to it.
- Validates the Case form context and checks that the selected Queue is active.
- Retrieves Case details and prevents duplicate active Queue Items for the same Case and Queue.
- Creates a custom Queue Item record linked to the selected Case and Queue.
- Stores the Case title, queue-entry timestamp, record type, and Functional or Technical classification for queue-based filtering.
- Displays success and error messages to provide feedback during the operation.

### 3. SLA Deadline Management

- **SLA Timings:** Calculates the First Response By and Resolve By deadlines based on the associated Account's service plan and the Case priority.
- Uses configurable timing values for different plan and priority combinations.
- Updates the corresponding Case deadline fields and handles missing customer information, account plans, or timing configurations.
- **SLA Item Synchronization:** Creates a custom SLA Item record using the Customer name and calculated deadline values, links the new record to the related Case, and refreshes the form after successful synchronization.

### 4. Case Creation Notifications

- Displays a success notification when a new Case is created successfully.
- Uses the Dataverse global notification API to show a toast notification within the model-driven app.
- Includes save-result validation to avoid displaying success messages when saving fails.
- Provides form event handlers for initialization and post-save notification handling.

### 5. Integrated Chat and Side Panels

- **Copilot Assistant Panel:** Opens a custom side panel for the assistant experience.
- **Teams Chat Panel:** Opens a separate side panel for Teams chat functionality.
- Uses the Dynamics 365 side-pane API to create, reuse, select, and close panels.
- Captures the current record's context, including its entity name, record ID, primary name, and owner.
- Retrieves recent activities related to the current record and stores the context for use by the integrated panels.

## Technical Implementation

- **JavaScript:** Implements form events, command bar actions, confirmation dialogs, Dataverse Web API operations, notifications, and side-panel interactions.
- **C# Plugin:** Performs server-side Case resolution logic, record validation, status updates, Case Resolution creation, and exception handling.
- **Dataverse:** Stores custom Cases, Queues, Queue Items, SLA Items, and Case Resolution records.
- **Dynamics 365 Client API:** Provides access to form context, navigation dialogs, progress indicators, notifications, and side-pane functionality.
- **Dataverse Web API:** Supports record retrieval, creation, updates, relationship binding, and Custom API execution.

## Project Structure

| File                         | Purpose                                                                                         |
|------------------------------|-------------------------------------------------------------------------------------------------|
| `ActivateCase.js`            | Handles Case activation and custom status updates.                                              |
| `AddToQueue.js`              | Adds Cases to custom Queues and creates linked Queue Items.                                     |
| `CancelCase.js`              | Implements Case cancellation with confirmation and status updates.                              |
| `CaseCreatedNotification.js` | Displays a success notification after Case creation.                                            | 
| `CaseResolve.js`             | Initiates the Case resolution process through a Custom API.                                     |
| `caseResolveBackup.js`       | Contains an alternate Resolve Case implementation with activity checking and cancellation logic.|
| `CasePlugin.txt`             | Contains the C# `ResolveCasePlugin` implementation.                                             |
| `SLA_Timings.js`             | Calculates SLA deadlines based on Account plans and Case priority.                              |
| `SLA_Item.js`                | Creates an SLA Item and links it to the related Case.                                           |
| `TeamsAndChatWindow.js`      | Manages the Copilot Assistant and Teams chat side panels.                                       |
|------------------------------|-------------------------------------------------------------------------------------------------|

## Learning Outcomes

- Implementing custom business logic in Dynamics 365 using JavaScript and C# Plugins.
- Working with Dataverse tables, relationships, lookups, and choice columns.
- Integrating the Dataverse Web API with model-driven app forms.
- Managing Case lifecycles, Queue Items, and service-level deadlines.
- Implementing error handling, validation, and user notifications.
- Extending the Customer Service experience through custom side panels and application integrations.

## Disclaimer

This repository contains custom implementations intended for a Dynamics 365 Customer Service learning and development project. Configuration requirements, table schema names, choice values, Custom API definitions, security privileges, and form event registrations must match the target environment. The code should be validated in a development environment before production use.
