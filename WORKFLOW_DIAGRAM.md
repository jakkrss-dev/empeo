# Empeo Dashboard - System Workflow Diagram

This document illustrates the complete automated workflow of the Empeo Attendance Dashboard.

## Architecture Flow

```mermaid
sequenceDiagram
    autonumber
    
    participant User as 👤 User (Web Browser)
    participant Vercel as 🌐 Vercel (Next.js)
    participant API as ⚙️ Vercel API
    participant Actions as 🤖 GitHub Actions
    participant Bot as 🐍 Python Bot
    participant Empeo as 🏢 Empeo Web
    participant Gist as 💾 GitHub Gist (DB)

    %% Initial Load
    rect rgb(240, 248, 255)
    Note over User, Gist: 1. Normal Usage (Viewing Dashboard)
    User->>Vercel: Visits Dashboard
    Vercel->>Gist: Fetch employee data (JSON/Base64)
    Gist-->>Vercel: Returns data
    Vercel-->>User: Renders UI and Charts
    end

    %% Auto Sync
    rect rgb(245, 255, 245)
    Note over Actions, Gist: 2. Automatic Daily Update (Cron Job)
    Note right of Actions: Triggers daily at 18:00
    Actions->>Bot: Executes `headless_empeo.py`
    Bot->>Empeo: Headless Login (Selenium)
    Empeo-->>Bot: Authenticated
    Bot->>Empeo: Request Report (C009)
    Empeo-->>Bot: Downloads Excel File
    Bot->>Bot: Convert Excel to Base64
    Bot->>Gist: Overwrite Gist with new data
    end

    %% Manual Sync
    rect rgb(255, 245, 245)
    Note over User, Gist: 3. Manual Update Workflow
    User->>Vercel: Clicks "Force Update"
    Vercel->>API: Calls Internal API (/api/sync)
    API->>Actions: Triggers via Repository Dispatch
    
    Note right of Actions: Same extraction process begins
    Actions->>Bot: Executes `headless_empeo.py`
    Bot->>Empeo: Download latest Excel
    Empeo-->>Bot: Returns File
    Bot->>Gist: Updates Gist data
    
    User->>Vercel: Clicks "Reload Data" (after ~1-2 mins)
    Vercel->>Gist: Fetch updated data
    Gist-->>Vercel: Returns new data
    Vercel-->>User: Dashboard updates with latest info
    end
```

## Description of Components:
- **Vercel (Next.js):** The frontend that users interact with. It directly pulls data from GitHub Gist to display charts.
- **Vercel API:** A serverless function inside the Next.js app used as a bridge to trigger GitHub Actions securely.
- **GitHub Actions:** The cloud runner that acts as the server to execute the data extraction.
- **Python Bot (`headless_empeo.py`):** The selenium web scraper that logs into Empeo, bypassing the need for an official API.
- **GitHub Gist:** Acts as a lightweight, free NoSQL database storing the encoded Excel file.
