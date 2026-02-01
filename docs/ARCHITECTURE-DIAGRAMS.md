# PMS Integration - Architecture & Diagrams

**SCRUM-108: PMS Integration Documentation**  
**Visual Guide with Mermaid Diagrams**

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph External["External Systems"]
        Hostaway["Hostaway PMS"]
    end
    
    subgraph Webhook["Webhook Layer"]
        Endpoint["POST /webhooks/hostaway/events"]
        SigGuard["Signature Guard<br/>HMAC-SHA256"]
        RateLimit["Rate Limit Guard<br/>100 req/min"]
    end
    
    subgraph Processing["Event Processing Layer"]
        Router["Event Router"]
        Handlers["Event Handlers"]
        RetryService["Retry Service<br/>3 attempts"]
    end
    
    subgraph Validation["Validation & Time-Blocking"]
        Mapper["Event Mapper"]
        TimeBlock["Time-Block Service<br/>Conflict Detection"]
        Validator["Validation Service"]
    end
    
    subgraph Storage["Data Layer"]
        PropertyDB["Properties"]
        ReservationDB["Reservations"]
        TimeBlockDB["Time Blocks"]
        DLQ["Dead Letter Queue"]
    end
    
    subgraph Notification["Notification Layer"]
        AdminAlert["Admin Alerts"]
        GuestNotif["Guest Notifications"]
    end
    
    Hostaway -->|Webhook| Endpoint
    Endpoint --> SigGuard
    SigGuard --> RateLimit
    RateLimit --> Router
    
    Router --> Handlers
    Handlers --> Mapper
    Mapper --> Validator
    Validator --> TimeBlock
    
    TimeBlock -->|Save| PropertyDB
    TimeBlock -->|Save| ReservationDB
    TimeBlock -->|Create Block| TimeBlockDB
    
    Handlers --> RetryService
    RetryService -->|After 3 failures| DLQ
    
    TimeBlock -->|If Conflict| AdminAlert
    Handlers -->|Confirmation| GuestNotif
```

---

## 🔄 Complete Event Processing Flow

```mermaid
graph TD
    A["🎯 Start: Webhook Event Arrives"] --> B["📥 Receive POST Request"]
    B --> C{"✓ Valid Signature?"}
    C -->|❌ Invalid| C1["🚫 Return 401 Unauthorized"]
    C -->|✅ Valid| D{"✓ Rate Limit OK?"}
    D -->|❌ Exceeded| D1["🚫 Return 429 Too Many Requests"]
    D -->|✅ OK| E["🔄 Parse Event JSON"]
    E --> F{"✓ Has Event Field?"}
    F -->|❌ Missing| F1["⚠️ Throw Error"]
    F -->|✅ Present| G["🗺️ Map Event Type"]
    G --> H{"Event Type?"}
    
    H -->|LISTING_UPDATED| I["🏠 Handle Listing Update"]
    H -->|RESERVATION_CREATED| J["🎫 Handle Reservation Created"]
    H -->|RESERVATION_UPDATED| K["✏️ Handle Reservation Updated"]
    H -->|RESERVATION_CANCELLED| L["❌ Handle Reservation Cancelled"]
    H -->|Unknown| M["⚠️ Log Warning & Skip"]
    
    I --> I1{"Property Exists?"}
    I1 -->|❌ No| I2["ℹ️ Log & Return Success"]
    I1 -->|✅ Yes| I3{"PMS Config<br/>Enabled?"}
    I3 -->|❌ No| I4["ℹ️ Log & Return Success"]
    I3 -->|✅ Yes| I5["✓ Validate Listing Data"]
    I5 -->|❌ Invalid| I6["⚠️ Throw Error"]
    I5 -->|✅ Valid| I7["💾 Sync Listing Data"]
    I7 --> SUCCESS["✅ Success"]
    
    J --> J1["🔍 Extract Dates"]
    J1 --> J2{"⏰ Check Time Block"}
    J2 -->|❌ Conflict Found| J3["⚠️ Create TimeBlock"]
    J3 --> J4["📊 Status: PENDING_REVIEW"]
    J4 --> J5["🚨 Alert Admin"]
    J5 --> SUCCESS
    J2 -->|✅ No Conflict| J6["✅ Create Reservation"]
    J6 --> J7["🔒 Lock Calendar Dates"]
    J7 --> SUCCESS
    
    K --> K1["🔍 Find Reservation"]
    K1 --> K2{"✓ Validate Update"}
    K2 -->|❌ Invalid| K3["⚠️ Throw Error"]
    K2 -->|✅ Valid| K4["⏰ Re-check Conflicts"]
    K4 -->|❌ Conflict| K5["⚠️ Create TimeBlock"]
    K5 --> SUCCESS
    K4 -->|✅ OK| K6["💾 Update Reservation"]
    K6 --> SUCCESS
    
    L --> L1["🔍 Find Reservation"]
    L1 --> L2["⏹️ Mark Cancelled"]
    L2 --> L3["🔓 Release Dates"]
    L3 --> SUCCESS
    
    F1 --> RETRY["🔄 Retry Logic"]
    I6 --> RETRY
    K3 --> RETRY
    
    RETRY --> R1{"Attempt < 3?"}
    R1 -->|✅ Yes| R2["⏳ Wait Backoff Time"]
    R2 -->|1st fail: 1s| RETRY
    R2 -->|2nd fail: 4s| RETRY
    R1 -->|❌ No| DLQ["📛 Move to Dead Letter Queue"]
    DLQ --> R3["🚨 Log to DLQ"]
    R3 --> R4["📧 Alert Monitoring"]
    
    M --> SUCCESS
    I2 --> SUCCESS
    I4 --> SUCCESS
    SUCCESS --> RESPONSE["📤 Return 200 OK"]
    C1 --> RESPONSE
    D1 --> RESPONSE
    R4 --> FAIL["📤 Return 500 Error"]
    FAIL --> RESPONSE
```

---

## ⏰ Time-Blocking Decision Tree

```mermaid
graph TD
    A["RESERVATION_CREATED<br/>Event Received"] --> B["Extract Reservation Data"]
    B --> C["checkIn: 2026-02-01<br/>checkOut: 2026-02-05"]
    C --> D["🔍 Query Existing<br/>Reservations for<br/>Property"]
    D --> E{"Overlapping<br/>Reservation<br/>Found?"}
    
    E -->|No Overlaps| F["✅ Safe to Create"]
    F --> F1["Create Reservation"]
    F1 --> F2["Status: CONFIRMED"]
    F2 --> F3["Lock Dates<br/>in Calendar"]
    F3 --> SUCCESS["Return 200 OK"]
    
    E -->|Found 1+ Conflicts| G["🚨 Conflict Detected"]
    G --> H{"Classify<br/>Conflict Type"}
    
    H -->|Exact Match<br/>Jan 1-5 vs Jan 1-5| I1["EXACT_OVERLAP<br/>🔴 CRITICAL"]
    H -->|Partial Start<br/>Jan 1-5 vs Jan 3-7| I2["PARTIAL_OVERLAP<br/>🟠 HIGH"]
    H -->|Partial End<br/>Jan 3-7 vs Jan 1-5| I3["PARTIAL_OVERLAP<br/>🟠 HIGH"]
    H -->|Contained<br/>Jan 1-10 vs Jan 3-7| I4["COMPLETE_OVERLAP<br/>🔴 CRITICAL"]
    H -->|Adjacent<br/>Jan 1-5 vs Jan 5-8| I5["ADJACENT<br/>✅ ALLOWED"]
    
    I1 --> J["🔒 Create TimeBlock"]
    I2 --> J
    I3 --> J
    I4 --> J
    I5 --> F
    
    J --> J1["Add Reservation IDs"]
    J1 --> J2["Calculate Overlap Days"]
    J2 --> J3["Set Priority:<br/>Based on<br/>Conflict Count"]
    J3 --> J4["Status: PENDING_REVIEW"]
    J4 --> J5["Create Reservation<br/>with Same Status"]
    J5 --> J6["🚨 Send Alert to Admin"]
    J6 --> J7["👥 Admin Reviews:<br/>- Conflict Details<br/>- Guest Info<br/>- Dates & Prices"]
    J7 --> J8{"Admin<br/>Decision"}
    J8 -->|Keep First<br/>Cancel Second| K1["Update TimeBlock<br/>Status: RESOLVED"]
    J8 -->|Keep Second<br/>Cancel First| K1
    J8 -->|Manual<br/>Investigation| K2["Update TimeBlock<br/>Status: PENDING<br/>Add Notes"]
    K1 --> K3["Send Notifications<br/>to Guests"]
    K2 --> K3
    K3 --> SUCCESS
```

---

## 🎯 Conflict Type Matrix

```mermaid
graph TB
    A["Conflict Type Analysis"] --> B["Date Ranges"]
    
    B --> C["Scenario 1: Exact Overlap"]
    C --> C1["Existing: Jan 1-5"]
    C1 --> C2["New: Jan 1-5"]
    C2 --> C3["Result: EXACT_OVERLAP ❌"]
    C3 --> C4["Overlap Days: 4"]
    C4 --> C5["Priority: CRITICAL"]
    
    B --> D["Scenario 2: Partial Overlap Start"]
    D --> D1["Existing: Jan 1-5"]
    D1 --> D2["New: Jan 3-7"]
    D2 --> D3["Result: PARTIAL_OVERLAP ❌"]
    D3 --> D4["Overlap Days: 2 (Jan 3-5)"]
    D4 --> D5["Priority: HIGH"]
    
    B --> E["Scenario 3: Partial Overlap End"]
    E --> E1["Existing: Jan 3-7"]
    E1 --> E2["New: Jan 1-5"]
    E2 --> E3["Result: PARTIAL_OVERLAP ❌"]
    E3 --> E4["Overlap Days: 2 (Jan 3-5)"]
    E4 --> E5["Priority: HIGH"]
    
    B --> F["Scenario 4: Complete Overlap"]
    F --> F1["Existing: Jan 1-10"]
    F1 --> F2["New: Jan 3-7"]
    F2 --> F3["Result: COMPLETE_OVERLAP ❌"]
    F3 --> F4["Overlap Days: 4"]
    F4 --> F5["Priority: CRITICAL"]
    
    B --> G["Scenario 5: Adjacent Dates"]
    G --> G1["Existing: Jan 1-5"]
    G1 --> G2["New: Jan 5-8"]
    G2 --> G3["Result: ADJACENT ✅"]
    G3 --> G4["Overlap Days: 0"]
    G4 --> G5["Priority: NONE<br/>Allowed!"]
    
    B --> H["Scenario 6: No Overlap"]
    H --> H1["Existing: Jan 1-5"]
    H1 --> H2["New: Jan 10-15"]
    H2 --> H3["Result: ALLOWED ✅"]
    H3 --> H4["Overlap Days: 0"]
    H4 --> H5["Priority: NONE<br/>Allowed!"]
```

---

## 📊 Data Flow Diagram

```mermaid
graph LR
    subgraph Input["Input"]
        HA["Hostaway<br/>Webhook"]
    end
    
    subgraph Parse["Parsing"]
        P1["Extract Event Data"]
        P2["Validate JSON"]
        P3["Map Event Type"]
    end
    
    subgraph Query["Database Query"]
        Q1["Query Property by ID"]
        Q2["Query Reservations"]
        Q3["Query Time Blocks"]
    end
    
    subgraph Transform["Transformation"]
        T1["Convert Data Types"]
        T2["Calculate Derived Fields"]
        T3["Map to Internal Schema"]
    end
    
    subgraph Decision["Decision Logic"]
        D1["Validate Data"]
        D2["Check Conflicts"]
        D3["Classify Conflict"]
    end
    
    subgraph Store["Storage"]
        S1["Save Property"]
        S2["Save Reservation"]
        S3["Save TimeBlock"]
        S4["Save DLQ Entry"]
    end
    
    subgraph Notify["Notifications"]
        N1["Alert Admin"]
        N2["Notify Guest"]
        N3["Log Metrics"]
    end
    
    HA --> P1
    P1 --> P2
    P2 --> P3
    
    P3 --> Q1
    Q1 --> Q2
    Q2 --> Q3
    
    Q3 --> T1
    T1 --> T2
    T2 --> T3
    
    T3 --> D1
    D1 --> D2
    D2 --> D3
    
    D3 -->|OK| S1
    D3 -->|Conflict| S3
    S1 --> S2
    S2 --> N1
    D3 -->|Error| S4
    S4 --> N3
    S3 --> N1
    N1 --> N2
```

---

## 🔀 Retry Flow with Backoff

```mermaid
graph TD
    A["Webhook Processing<br/>Attempt 1"] --> B{"Processing<br/>Successful?"}
    B -->|✅ Yes| C["Return 200 OK"]
    B -->|❌ No| D["Log Error"]
    D --> E["Increment Attempt Counter"]
    E --> F{"Attempt < 3?"}
    F -->|❌ No (3rd failure)| G["Move to Dead Letter Queue"]
    G --> G1["Log DLQ Entry"]
    G1 --> G2["Send Alert"]
    G2 --> H["Return 500 Error"]
    F -->|✅ Yes| I{"Which Attempt?"}
    I -->|1st Attempt| J1["Wait 1 second"]
    I -->|2nd Attempt| J2["Wait 4 seconds"]
    J1 --> K["Retry from Step A"]
    J2 --> K
    K --> A
    C --> END["End"]
    H --> END
```

---

## 👥 Admin Resolution Workflow

```mermaid
graph TD
    A["⚠️ TimeBlock Created<br/>Status: PENDING_REVIEW"] --> B["🚨 Alert Sent to Admin"]
    B --> C["📱 Admin Receives<br/>Slack/Email Notification"]
    C --> D["🔍 Admin Opens<br/>Conflict Resolution UI"]
    D --> E["📊 Display:<br/>- Conflicting Reservations<br/>- Guest Info<br/>- Price Details<br/>- Dates & Duration"]
    E --> F{"Admin<br/>Decision"}
    F -->|Keep First<br/>Cancel Second| G["✅ Approve First<br/>Reservation"]
    F -->|Keep Second<br/>Cancel First| H["✅ Approve Second<br/>Reservation"]
    F -->|Manual Review| I["⏳ Add Notes &<br/>Defer Decision"]
    F -->|Merge/Combine| J["🔄 Update Both<br/>Reservations"]
    G --> K["Cancel Conflicting<br/>Reservation"]
    H --> K
    J --> K
    K --> L["Release Blocked Dates"]
    L --> M["Send Notification<br/>to Guest"]
    M --> N["Update TimeBlock<br/>Status: RESOLVED"]
    N --> O["✅ Complete"]
    I --> P["TimeBlock Status:<br/>PENDING<br/>Expires in 7 days"]
    P --> Q["Auto-cleanup<br/>if unresolved"]
```

---

## 📈 Monitoring & Metrics Dashboard

```mermaid
graph TB
    subgraph Metrics["Key Metrics"]
        M1["Total Webhooks/Day"]
        M2["Success Rate %"]
        M3["Avg Processing Time"]
        M4["Error Rate %"]
        M5["Time Block Count"]
        M6["DLQ Size"]
    end
    
    subgraph Targets["Target Values"]
        T1["10,000+ events"]
        T2["> 99%"]
        T3["< 2 seconds"]
        T4["< 1%"]
        T5["< 5/day"]
        T6["< 10 items"]
    end
    
    subgraph Alerts["Alert Thresholds"]
        A1["❌ > 100 events with errors"]
        A2["⚠️ Success rate < 98%"]
        A3["⚠️ Avg time > 5 seconds"]
        A4["❌ Error rate > 2%"]
        A5["⚠️ Time blocks > 50"]
        A6["🚨 DLQ size > 100"]
    end
    
    subgraph Actions["Automated Actions"]
        AC1["Send Slack alert"]
        AC2["Page on-call engineer"]
        AC3["Create incident ticket"]
        AC4["Trigger runbook"]
    end
    
    M1 --> T1
    M2 --> T2
    M3 --> T3
    M4 --> T4
    M5 --> T5
    M6 --> T6
    
    T1 --> A1
    T2 --> A2
    T3 --> A3
    T4 --> A4
    T5 --> A5
    T6 --> A6
    
    A1 --> AC1
    A2 --> AC2
    A3 --> AC3
    A4 --> AC4
    A5 --> AC1
    A6 --> AC2
```

---

## 🔐 Security Validation Flow

```mermaid
graph TD
    A["Webhook Request<br/>Received"] --> B["Extract Headers:<br/>- Signature<br/>- Timestamp"]
    B --> C["Extract Body"]
    C --> D["Generate Expected<br/>HMAC-SHA256"]
    D --> D1["Message = Body"]
    D1 --> D2["Secret = API Key"]
    D2 --> D3["Signature = HMAC(Message, Secret)"]
    D3 --> E{"Signature<br/>Matches?"}
    E -->|❌ No| F["🚫 Return 401"]
    E -->|✅ Yes| G["Check Timestamp"]
    G --> G1{"Timestamp<br/>Recent?<br/>< 5 min"}
    G1 -->|❌ Old| H["🚫 Return 401"]
    G1 -->|✅ Recent| I["Check Rate Limit"]
    I --> I1{"Requests<br/>< 100/min?"}
    I1 -->|❌ Exceeded| J["🚫 Return 429"]
    I1 -->|✅ OK| K["✅ Continue Processing"]
```

---

## 📦 Error Handling State Machine

```mermaid
stateDiagram-v2
    [*] --> Processing: Event Received
    Processing --> Success: Completes OK
    Processing --> Error: Throws Exception
    
    Error --> Attempt1: Attempt 1
    Attempt1 --> Error: Fails
    Attempt1 --> Success: Succeeds
    
    Error --> Wait1: Wait 1 second
    Wait1 --> Attempt2: Attempt 2
    Attempt2 --> Error: Fails
    Attempt2 --> Success: Succeeds
    
    Error --> Wait2: Wait 4 seconds
    Wait2 --> Attempt3: Attempt 3
    Attempt3 --> Error: Fails (Final)
    Attempt3 --> Success: Succeeds
    
    Error --> DeadLetter: Max Attempts Exceeded
    DeadLetter --> Monitoring: Alert Sent
    Monitoring --> Manual: Admin Review
    Manual --> [*]
    
    Success --> [*]
```

---

## 📊 Property & Reservation Entity Relationship

```mermaid
erDiagram
    PROPERTY ||--o{ RESERVATION : has
    PROPERTY ||--o{ PMS_CONFIG : manages
    RESERVATION ||--o{ TIME_BLOCK : may_create
    TIME_BLOCK ||--o{ RESERVATION : contains
    
    PROPERTY {
        ObjectId _id
        string externalPropertyId
        string name
        string address
        GeoJSON coordinates
        number nightly_rate
        string currency
        number max_guests
        Date createdAt
        Date updatedAt
    }
    
    RESERVATION {
        ObjectId _id
        string externalReservationId
        ObjectId propertyId
        string guestName
        string guestEmail
        Date checkInDate
        Date checkOutDate
        number numberOfNights
        number numberOfGuests
        number totalPrice
        enum reservationStatus
        ObjectId timeBlockId
        Date createdAt
    }
    
    TIME_BLOCK {
        ObjectId _id
        ObjectId propertyId
        array reservationIds
        Date checkInDate
        Date checkOutDate
        enum conflictType
        number overlapDays
        enum status
        Date createdAt
        Date resolvedAt
    }
    
    PMS_CONFIG {
        ObjectId _id
        string provider
        string externalPropertyId
        boolean enabled
        Date createdAt
    }
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Hostaway["Hostaway PMS<br/>API"]
    end
    
    subgraph LB["Load Balancer"]
        ELB["AWS ELB<br/>Port 443"]
    end
    
    subgraph API["API Servers"]
        Pod1["Pod 1<br/>NestJS App"]
        Pod2["Pod 2<br/>NestJS App"]
        Pod3["Pod 3<br/>NestJS App"]
    end
    
    subgraph Cache["Cache Layer"]
        Redis["Redis<br/>Session &<br/>Rate Limit"]
    end
    
    subgraph DB["Data Layer"]
        Mongo["MongoDB<br/>Primary"]
        MongoRep["MongoDB<br/>Replica"]
    end
    
    subgraph Queue["Queue & DLQ"]
        RabbitMQ["RabbitMQ<br/>Webhook Queue"]
        DLQ_Store["DLQ<br/>Collection"]
    end
    
    subgraph Monitor["Monitoring"]
        Prometheus["Prometheus"]
        Grafana["Grafana<br/>Dashboard"]
        AlertMgr["AlertManager"]
    end
    
    Hostaway --> ELB
    ELB --> Pod1
    ELB --> Pod2
    ELB --> Pod3
    
    Pod1 --> Redis
    Pod2 --> Redis
    Pod3 --> Redis
    
    Pod1 --> Mongo
    Pod2 --> Mongo
    Pod3 --> Mongo
    Mongo --> MongoRep
    
    Pod1 --> RabbitMQ
    Pod2 --> RabbitMQ
    Pod3 --> RabbitMQ
    RabbitMQ --> DLQ_Store
    
    Pod1 --> Prometheus
    Pod2 --> Prometheus
    Pod3 --> Prometheus
    Prometheus --> Grafana
    Prometheus --> AlertMgr
```

---

## 🎯 Implementation Timeline

```mermaid
gantt
    title PMS Integration Implementation Timeline
    
    section Planning
    Requirements :plan1, 2026-01-15, 5d
    Design Review :plan2, after plan1, 5d
    
    section Development
    Model Creation :dev1, after plan2, 5d
    Conflict Detection :dev2, after dev1, 7d
    Event Handlers :dev3, after dev2, 7d
    Time-Blocking :dev4, after dev3, 7d
    Testing :dev5, after dev4, 5d
    
    section Deployment
    Staging Deploy :deploy1, after dev5, 3d
    UAT Testing :deploy2, after deploy1, 5d
    Production Deploy :deploy3, after deploy2, 2d
    
    section Operations
    Monitoring :ops1, after deploy3, 30d
    Optimization :ops2, after ops1, 20d
```

---

**Visual Guide Created**: January 29, 2026  
**Diagrams**: 15+ Mermaid diagrams  
**Coverage**: Complete architecture, flows, and workflows
