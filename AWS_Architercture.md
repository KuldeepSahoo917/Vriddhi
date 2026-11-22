# Vriddhi – AWS Three-Tier Architecture Deployment

## Architecture Overview

The Vriddhi infrastructure follows a **three-tier architecture** designed to provide network isolation, security, and high availability across two AWS Availability Zones.

### Architecture Tiers

1. **Presentation Tier:** React application served through Nginx.
2. **Application Tier:** Node.js and Express backend.
3. **Database Tier:** MongoDB.

### AWS Infrastructure Components

- 1 Virtual Private Cloud (VPC)
- 2 Availability Zones
- 2 Public Subnets
- 6 Private Subnets
- 1 Internet Gateway (IGW)
- 1 NAT Gateway
- Separate route tables for Presentation, Application, and Database tiers

---

## Phase 1 – VPC and Networking

### 1.1 VPC Creation

Created a Virtual Private Cloud (VPC) to provide an isolated networking environment for the Vriddhi application.

| Configuration | Value |
|---|---|
| VPC Name | `Vriddhi-VPC` |
| VPC ID | `vpc-0eba256356878bd05` |
| IPv4 CIDR | `10.0.0.0/16` |
| AWS Region | `ap-south-1` (Mumbai) |
| Tenancy | Default |

### 1.2 Subnet Configuration

Created eight subnets distributed across two Availability Zones to separate the Presentation, Application, and Database tiers.

| Tier | Subnet Name | CIDR Block |
|---|---|---|
| Public | Public-Subnet-A | `10.0.1.0/24` |
| Public | Public-Subnet-B | `10.0.2.0/24` |
| Application | Private-App-Subnet-A | `10.0.11.0/24` |
| Application | Private-App-Subnet-B | `10.0.12.0/24` |
| Database | Private-DB-Subnet-A | `10.0.21.0/24` |
| Database | Private-DB-Subnet-B | `10.0.22.0/24` |
| Presentation | Private-Presentation-Subnet-A | `10.0.31.0/24` |
| Presentation | Private-Presentation-Subnet-B | `10.0.32.0/24` |

**Subnet Distribution:**

- Public Subnets: 2
- Private Subnets: 6
- Total Subnets: 8

### 1.3 Internet Gateway (IGW)

Created and attached an Internet Gateway to `Vriddhi-VPC`.

**Purpose:**
- Provides internet connectivity to resources in public subnets.
- Enables internet-facing resources, such as the Application Load Balancer, to communicate with external users.
- Acts as the internet gateway for the VPC's public route table.

### 1.4 Public Route Table

Created a public route table named `Vriddhi-Public-RT`.

**Route Configuration:**

| Destination | Target |
|---|---|
| `10.0.0.0/16` | Local |
| `0.0.0.0/0` | Internet Gateway |

**Associated Subnets:**
- `Public-Subnet-A`
- `Public-Subnet-B`

This configuration enables internet routing for resources deployed in the public subnets, subject to their security and public IP configuration.

### 1.5 NAT Gateway

Created a public NAT Gateway named `Vriddhi-NAT-GW` in `Public-Subnet-A` using an allocated Elastic IP address.

**Purpose:**
- Provides outbound internet connectivity to resources in private subnets.
- Allows private EC2 instances to download software packages and security updates.
- Eliminates the need for private instances to have direct public internet connectivity.

### 1.6 Private Route Tables

Created separate route tables for the Presentation, Application, and Database tiers to control network traffic independently.

#### A. Presentation Route Table

**Route Table:** `Vriddhi-Private-Presentation-RT`

**Associated Subnets:**
- `Private-Presentation-Subnet-A`
- `Private-Presentation-Subnet-B`

**Route Configuration:**

| Destination | Target |
|---|---|
| `10.0.0.0/16` | Local |
| `0.0.0.0/0` | NAT Gateway |

This configuration provides outbound internet connectivity to the Presentation Tier while keeping the Nginx instances in private subnets.

#### B. Application Route Table

**Route Table:** `Vriddhi-Private-App-RT`

**Associated Subnets:**
- `Private-App-Subnet-A`
- `Private-App-Subnet-B`

**Route Configuration:**

| Destination | Target |
|---|---|
| `10.0.0.0/16` | Local |
| `0.0.0.0/0` | NAT Gateway |

This configuration allows the Node.js and Express backend instances to access external services and download required dependencies through the NAT Gateway.

#### C. Database Route Table

**Route Table:** `Vriddhi-DB-RT`

**Associated Subnets:**
- `Private-DB-Subnet-A`
- `Private-DB-Subnet-B`

**Route Configuration:**

| Destination | Target |
|---|---|
| `10.0.0.0/16` | Local |
| `0.0.0.0/0` | NAT Gateway |

The Database Tier does not have a default internet route through the NAT Gateway. This restricts general outbound internet connectivity while allowing internal communication within the VPC. During MongoDB installation, a NAT route was temporarily added to download required packages and was removed after installation.

This keeps the database subnet without general outbound internet access while allowing private communication within the VPC.

---

## Phase 2 – Security Groups

Security Groups were configured to control inbound traffic between the different tiers. Each tier has a dedicated Security Group so that only the required sources can access its resources.

### 2.1 Bastion Security Group

**Security Group:** `Vriddhi-Bastion-SG`

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| SSH | TCP | 22 | Administrator public IP (`/32`) | Allows the administrator to SSH into the Bastion Host |

SSH access is restricted to the administrator's public IP rather than being opened to all IPv4 addresses.

### 2.2 Web Load Balancer Security Group

**Security Group:** `Vriddhi-WebALB-SG`

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| HTTP | TCP | 80 | `0.0.0.0/0` | Allows public HTTP requests to reach the Web Load Balancer |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Allows public HTTPS requests to reach the Web Load Balancer |

HTTPS was not configured at this stage because an ACM certificate had not been configured.

### 2.3 Web Server Security Group

**Security Group:** `Vriddhi-Web-SG`

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| HTTP | TCP | 80 | `Vriddhi-WebALB-SG` | Allows the Web Load Balancer to reach Nginx |
| SSH | TCP | 22 | `Vriddhi-Bastion-SG` | Allows administrative SSH through Bastion |

The Web EC2 instances are not directly open to the internet. HTTP access is allowed from the Web Load Balancer Security Group.

### 2.4 Application Load Balancer Security Group

**Security Group:** `Vriddhi-AppALB-SG`

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| HTTP | TCP | 80 | `Vriddhi-Web-SG` | Allows the Web tier to reach the internal Application Load Balancer |

The Application Load Balancer is internal and is intended to receive traffic from the Web tier, not directly from the public internet.

### 2.5 Application Server Security Group

**Security Group:** `Vriddhi-App-SG`

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| Custom TCP | TCP | 4000 | `Vriddhi-AppALB-SG` | Allows the Application Load Balancer to reach the Node.js/Express backend |
| SSH | TCP | 22 | `Vriddhi-Bastion-SG` | Allows administrative SSH through Bastion |

The backend listens on port `4000`. The application EC2 instances are not intended to accept direct public traffic.

### 2.6 Database Security Group

**Security Group:** `Vriddhi-Database-SG`

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| Custom TCP | TCP | 27017 | `Vriddhi-App-SG` | Allows the backend to connect to MongoDB |
| SSH | TCP | 22 | `Vriddhi-Bastion-SG` | Allows administrative SSH through Bastion |

MongoDB's default port `27017` is allowed from the Application Security Group, not from the public internet.

### 2.7 Additional Rule for MongoDB Compass

During MongoDB Compass connectivity setup, an additional inbound rule was added to `Vriddhi-Database-SG`.

| Type | Protocol | Port | Source | Purpose |
|---|---|---:|---|---|
| Custom TCP | TCP | 27017 | `Vriddhi-Bastion-SG` | Allows the Bastion Host to forward the Compass SSH-tunnel connection to MongoDB |

This rule was required because the SSH tunnel forwards traffic through Bastion, and Bastion must be allowed to reach MongoDB on port `27017`.

**Security note:** This is a Security Group reference, not a public CIDR rule. Do not open MongoDB to `0.0.0.0/0`. The Bastion-to-database rule can be removed when Compass access through the Bastion is no longer needed.

Default outbound rules were retained for the Security Groups.

---

## Phase 3 – Bastion Host and MongoDB EC2 Provisioning

### 3.1 Bastion Host Creation

Launched an EC2 instance to act as the secure administrative entry point to private instances.

| Configuration | Value |
|---|---|
| Instance Name | `Vriddhi-Bastion` |
| Operating System | Ubuntu 26.04.1 LTS |
| Public IP | `13.127.133.75` |
| Private IP | `10.0.1.67` |
| Subnet | `Public-Subnet-A` |
| Security Group | `Vriddhi-Bastion-SG` |
| SSH Username | `ubuntu` |
| Key Pair | `Vriddhi.pem` |

**Purpose of Bastion Host:**

- Provides a controlled SSH entry point into the VPC.
- Allows administrators to reach private EC2 instances.
- Avoids assigning public IP addresses to private application and database instances.
- Keeps administrative access separate from normal application traffic.

### 3.2 MongoDB EC2 Creation

Launched a private EC2 instance to host MongoDB Community Server.

| Configuration | Value |
|---|---|
| Instance Name | `Vriddhi-MongoDB` |
| Operating System | Ubuntu 26.04.1 LTS |
| Public IP | None |
| Private IP | `10.0.21.198` |
| Subnet | `Private-DB-Subnet-A` |
| Security Group | `Vriddhi-Database-SG` |
| SSH Username | `ubuntu` |
| Key Pair | `Vriddhi.pem` |

The MongoDB instance was launched without a public IP. It is accessed administratively through the Bastion Host and accessed by the backend through its private IP.

**Database deployment decision:** One MongoDB EC2 instance was deployed initially. Although two DB subnets exist across two Availability Zones, a second MongoDB instance, replica set, and automatic failover have not been configured. The current database instance is therefore a single point of failure.

---

### IMPORTANT: ALTERNATIVES: 

Session Manager(SSM) for managing private EC2 instances, because it avoids maintaining a jump server and managing SSH keys.

EC2 Instance Connect Endpoint(EICE)

VPN Connection

---

## Phase 4 – SSH Access Through Bastion

### 4.1 Configuring Jump Server when Required on Windows

If both Bastion and MongoDB use Vriddhi.pem, use this command:
```powershell
ssh -i ".\Downloads\Vriddhi.pem" -o "ProxyCommand=ssh -i .\Downloads\Vriddhi.pem -o IdentitiesOnly=yes -W %h:%p ubuntu@13.127.133.75" -o IdentitiesOnly=yes ubuntu@10.0.21.198
```

If they use different keys, use:
```powershell
ssh -i ".\Downloads\etc.pem" -o "ProxyCommand=ssh -i .\Downloads\Vriddhi.pem -o IdentitiesOnly=yes -W %h:%p ubuntu@13.127.133.75" -o IdentitiesOnly=yes ubuntu@10.0.21.198
```

### 4.2 Configure SSH on Windows

Configured the Windows SSH client file:

```text
C:\Users\<WINDOWS_USER>\.ssh\config
```

Added the following host aliases:

```sshconfig
Host vriddhi-bastion
    HostName 13.127.133.75
    User ubuntu
    IdentityFile C:/Users/<WINDOWS_USER>/Downloads/Vriddhi.pem
    IdentitiesOnly yes

Host vriddhi-mongodb
    HostName 10.0.21.198
    User ubuntu
    IdentityFile C:/Users/<WINDOWS_USER>/Downloads/Vriddhi.pem
    IdentitiesOnly yes
    ProxyJump vriddhi-bastion
```

Replace `<WINDOWS_USER>` with the actual Windows profile folder name.

### 4.3 Verify SSH Configuration

Executed in Windows PowerShell:

```powershell
ssh -G vriddhi-bastion | Select-String "hostname|user|identityfile"
```

This was used to verify the SSH alias, hostname, username, and identity file.

### 4.4 Connect to Bastion

From Windows CMD or PowerShell:

```powershell
ssh -i "C:\Users\<WINDOWS_USER>\Downloads\Vriddhi.pem" ubuntu@13.127.133.75
```

A successful connection displayed a prompt similar to:

```text
ubuntu@ip-10-0-1-67:~$
```

### 4.5 Connect to MongoDB Through ProxyJump

From Windows CMD or PowerShell, executed:

```powershell
ssh vriddhi-mongodb
```

The SSH configuration automatically routes the connection through `vriddhi-bastion` to the MongoDB private IP `10.0.21.198`.

To exit an SSH session:

```bash
exit
```

**Private-key security:** The `Vriddhi.pem` private key remains on the Windows laptop. It is not copied to the Bastion Host.

---

## Phase 5 – MongoDB Installation and Configuration

### 5.1 MongoDB Installation

Installed MongoDB Community Server 9.0 on `Vriddhi-MongoDB`.

The MongoDB 9.0 signing key and Ubuntu `resolute` package repository were configured before installing the `mongodb-org` packages. The exact key-import and repository-add command lines were not retained in the session notes and are therefore not reproduced here.

### 5.2 Start and Verify MongoDB

Restarted the MongoDB service:

```bash
sudo systemctl restart mongod
```

Checked the service status:

```bash
sudo systemctl status mongod
```

MongoDB was confirmed to be running and was enabled to start automatically at boot.

### 5.3 Configure MongoDB Network Binding and Authentication

Opened the MongoDB configuration file:

```bash
sudo nano /etc/mongod.conf
```

Configured the relevant settings:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1,10.0.21.198

security:
  authorization: enabled
```

**Configuration explanation:**

- `port: 27017` – MongoDB listens on its default port.
- `127.0.0.1` – Allows local connections from the MongoDB EC2 instance.
- `10.0.21.198` – Allows connections through the instance's private network interface.
- `authorization: enabled` – Requires database clients to authenticate.

Saved the file and restarted MongoDB:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

### 5.4 Verify MongoDB Using MongoDB Shell

Opened MongoDB Shell:

```bash
mongosh
```

Executed a ping command:

```javascript
db.runCommand({ ping: 1 })
```

Expected successful response:

```javascript
{ ok: 1 }
```

This confirmed that MongoDB was responding.

### 5.5 Create the Administrative User

In MongoDB Shell:

```javascript
use admin

db.createUser({
  user: "vriddhiAdmin",
  pwd: passwordPrompt(),
  roles: [
    { role: "root", db: "admin" }
  ]
})
```

The password was entered interactively and is not stored in this README.

### 5.6 Create the Application Database and User

Selected the application database:

```javascript
use vriddhi
```

Created the application user:

```javascript
db.createUser({
  user: "vriddhiApp",
  pwd: passwordPrompt(),
  roles: [
    { role: "readWrite", db: "vriddhi" }
  ]
})
```

The `vriddhiApp` user has read/write permissions on the `vriddhi` database.

### 5.7 Test MongoDB User Authentication

Tested the administrative user:

```bash
mongosh -u vriddhiAdmin --authenticationDatabase admin -p
```

Tested the application user:

```bash
mongosh -u vriddhiApp --authenticationDatabase vriddhi -p
```

After logging in as the application user:

```javascript
use vriddhi
db.runCommand({ ping: 1 })
```

A successful `{ ok: 1 }` response confirmed authenticated database access.

Exited MongoDB Shell using:

```javascript
exit
```

**Application security:** The backend must use `vriddhiApp` for database access. The `vriddhiAdmin` account is reserved for administration.

---

## Phase 6 – MongoDB Compass Connectivity

### 6.1 Configure SSH Local Port Forwarding

MongoDB Compass was used as a graphical client on the Windows laptop. Since MongoDB is in a private subnet, an SSH tunnel was configured through Bastion.

Executed in a Windows terminal:

```powershell
ssh -N -L 27018:10.0.21.198:27017 vriddhi-bastion
```

The terminal must remain open while MongoDB Compass is using the tunnel.

### 6.2 MongoDB Compass Connection String

Used the following connection string in MongoDB Compass:

```text
mongodb://vriddhiApp:<PASSWORD>@localhost:27018/vriddhi?authSource=vriddhi
```

Replace `<PASSWORD>` with the actual password for `vriddhiApp`.

### 6.3 Connection Flow

```text
MongoDB Compass on Windows
          |
          v
Windows localhost:27018
          |
          v
SSH local port forwarding
          |
          v
Bastion Host (13.127.133.75)
          |
          v
MongoDB EC2 (10.0.21.198:27017)
```

Initially, the tunnel could not reach MongoDB because the Database Security Group did not allow the Bastion Security Group to connect to port `27017`. After adding the Bastion Security Group as the source for TCP `27017`, Compass connected successfully.

---

## Phase 7 – Backend Database Connection Configuration

When the Node.js backend is deployed on the private Application EC2, the backend environment variable will use the MongoDB private IP directly.

```env
MONGODB_URI=mongodb://vriddhiApp:<PASSWORD>@10.0.21.198:27017/vriddhi?authSource=vriddhi
```

Replace `<PASSWORD>` with the actual application-user password.

This connection is used by the backend inside the VPC. It does not use the Compass SSH tunnel or Bastion.

When migrating the backend connection from MongoDB Atlas to the self-managed MongoDB EC2:

- Update the backend `MONGODB_URI` environment variable.
- Keep the existing Mongoose models and schemas.
- Keep the existing CRUD operations.
- Migrate existing Atlas data separately if it is required; changing the connection string does not copy data.

---
## Phase 8 -- Create Target Groups and Load Balancers

The application uses separate load balancers for the Web and Application
tiers.

### 8.1 Application Target Group

Created target group:

-   **Name:** `Vriddhi-App-TG`
-   **Target type:** Instances
-   **Protocol:** HTTP
-   **Port:** 4000
-   **VPC:** `Vriddhi-VPC`
-   **Health check path:** `/health`
-   **Success code:** `200`
-   Registered the existing App EC2 instance, `Vriddhi-App`.

The target became **Healthy**.

### 8.2 Internal Application Load Balancer

Created:

-   **Name:** `Vriddhi-App-ALB`
-   **Scheme:** Internal
-   **IP address type:** IPv4
-   **VPC:** `Vriddhi-VPC`
-   **Subnets:** `Private-App-Subnet-A` and `Private-App-Subnet-B`
-   **Security group:** `Vriddhi-AppALB-SG`
-   **Listener:** HTTP, port 80
-   **Default action:** Forward to `Vriddhi-App-TG`

The internal ALB DNS name is:

``` text
internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com
```

The App target group was verified as **Healthy**.

### 8.3 Web Target Group

Created target group:

-   **Name:** `Vriddhi-Web-TG`
-   **Target type:** Instances
-   **Protocol:** HTTP
-   **Port:** 80
-   **VPC:** `Vriddhi-VPC`
-   **Health check path:** `/`
-   **Success code:** `200`
-   Registered the existing Web EC2 instance, `Vriddhi-Web`.

The target became **Healthy**.

### 8.4 Public Web Load Balancer

Created:

-   **Name:** `Vriddhi-Web-ALB`
-   **Scheme:** Internet-facing
-   **IP address type:** IPv4
-   **VPC:** `Vriddhi-VPC`
-   **Subnets:** `Public-Subnet-A` and `Public-Subnet-B`
-   **Security group:** `Vriddhi-WebALB-SG`
-   **Listener:** HTTP, port 80
-   **Default action:** Forward to `Vriddhi-Web-TG`

The application is accessed using the **DNS name** of `Vriddhi-Web-ALB`
in a browser:

``` text
http://<Vriddhi-Web-ALB-DNS-name>
```

The ALB ARN identifies the AWS resource; it is not the address used to
open the website.

Both Web and App target groups were verified as **Healthy**.

## Phase 9 -- Configure Frontend API Routing Through Nginx

The React frontend is served by Nginx on the private Web EC2. The
Node.js backend runs separately on the private App EC2.

The browser must send API requests to the public Web ALB. Nginx then
forwards `/api/` requests to the internal App ALB. The browser must not
call the internal ALB directly because it is not internet-facing.

### 9.1 Frontend API environment variable

On the Web EC2, the frontend `.env` file was checked. It initially
contained an empty value:

``` env
VITE_API_URL=
```

The `.env.example` file contained an old localhost example:

``` env
VITE_API_URL=http://localhost:4000
```

The frontend API URL was kept empty so the frontend can use relative API
paths, such as `/api/auth/register`, through the same public Web ALB
origin.

Because Vite embeds environment variables during the frontend build, the
frontend image was rebuilt after changing the configuration.

### 9.2 Nginx reverse proxy configuration

Updated `~/Vriddhi/frontend/nginx.conf` on the Web EC2:

``` nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Forward API requests to Internal App ALB
    location /api/ {
        proxy_pass http://internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve React application
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

This configuration sends requests such as:

``` text
POST /api/auth/register
```

from Nginx to:

``` text
http://internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com/api/auth/register
```

### 9.3 Rebuild and restart the frontend container

The frontend Docker image was rebuilt as `vriddhi-frontend:v4` after
updating `.env` and `nginx.conf`.

Commands used:

``` bash
cd ~/Vriddhi/frontend

sudo docker build --no-cache -t vriddhi-frontend:v4 .

sudo docker stop vriddhi-frontend
sudo docker rm vriddhi-frontend

sudo docker run -d --name vriddhi-frontend -p 80:80 vriddhi-frontend:v4

sudo docker exec vriddhi-frontend nginx -t
```

Nginx configuration validation was completed.

## Phase 10 -- Verify Connectivity and API

### 10.1 Test Web EC2 to Internal App ALB

From the Web EC2, ran:

``` bash
curl -i http://internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com/health
```

The response returned:

``` text
HTTP/1.1 200 OK
```

This verified that the Web EC2 could reach the Internal App ALB and that
the backend health endpoint responded successfully.

### 10.2 Test the registration API directly

From the Web EC2, tested the registration endpoint through the Internal
App ALB:

``` bash
curl -i -X POST \
  http://internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123!"}'
```

The response returned:

``` text
HTTP/1.1 201 Created
```

This verified that the registration API accepted the test request
through the internal load balancer.

A browser registration attempt still displayed a generic "Something went
wrong" message during testing. The direct API test succeeded, so
browser-side behavior still needs to be checked separately.

## Phase 11 -- Access MongoDB Using MongoDB Compass

MongoDB Compass was connected from the local Windows laptop through an
SSH tunnel via the Bastion Host.

### 11.1 Start the SSH tunnel

Run this command in PowerShell on the laptop:

``` powershell
ssh -N -L 27018:10.0.21.198:27017 vriddhi-bastion
```

The command runs without displaying a success message when the tunnel is
established. Keep the PowerShell window open while using Compass.

### 11.2 MongoDB Compass connection string

Use:

``` text
mongodb://vriddhiApp:<PASSWORD>@localhost:27018/vriddhi?authSource=vriddhi
```

Replace `<PASSWORD>` with the MongoDB application user's password. Do
not save the actual password in this README.

### 11.3 Verify stored registration data

After connecting in Compass:

1.  Open the `vriddhi` database.
2.  Open the `users` collection.
3.  Use **Find** to inspect documents.
4.  Look for the test registration document, if it was created by the
    API test.

Passwords should be stored as password hashes, not plaintext values.

The Compass connection uses the SSH tunnel for administration. The
backend itself connects directly to MongoDB using the private IP
`10.0.21.198`; it does not use the tunnel or Bastion.

---
# Vriddhi – AWS Deployment Documentation
## Work Completed After the Previous README

**Project:** Vriddhi – MERN Stack Application  
**Repository:** https://github.com/KuldeepSahoo917/Vriddhi  
**AWS Region:** Asia Pacific (Mumbai) – `ap-south-1`  
**AWS Account ID:** `001800893431`  
**Period Covered:** 19–21 November 2026

---

# Phase 8 – Preparing Launch Templates for Automated Deployment

After completing the initial manual deployment and testing of the application, the next objective was to automate EC2 provisioning.

Previously, the application was deployed manually on individual EC2 instances. The new architecture uses:

- Launch Templates
- EC2 User Data
- Docker
- Amazon ECR
- Application Load Balancers
- Target Groups
- Auto Scaling Groups

The existing launch templates were initially created for testing purposes:

1. `Vriddhi-App-LT`
2. `Vriddhi-Web-LT`

Initially, their User Data sections were empty because Docker installation, image deployment, and application startup had been performed manually.

The plan was to create updated launch template versions containing the required deployment scripts.

## Deployment approach

**Application tier:**

1. Launch an EC2 instance using the App Launch Template.
2. Install Docker and required utilities through User Data.
3. Authenticate with Amazon ECR.
4. Pull the backend Docker image.
5. Retrieve backend configuration from AWS Secrets Manager.
6. Create the backend environment file.
7. Start the backend container on port 4000.
8. Verify the backend health endpoint.

**Web tier:**

1. Launch an EC2 instance using the Web Launch Template.
2. Install Docker and required utilities.
3. Authenticate with Amazon ECR.
4. Pull the frontend Docker image.
5. Configure Nginx to communicate with the internal Application Load Balancer.
6. Start the frontend container on port 80.

---

# Phase 9 – Creating Amazon ECR Repositories

Amazon Elastic Container Registry (ECR) was introduced to store the Docker images of the frontend and backend applications.

Two private repositories were created.

| Repository | Purpose |
|---|---|
| `vriddhi-backend` | Stores the Node.js backend Docker image |
| `vriddhi-frontend` | Stores the React frontend Docker image |

Both repositories were created in the Mumbai region.

**Registry URI:**

`001800893431.dkr.ecr.ap-south-1.amazonaws.com`

The images are stored separately because the frontend and backend are deployed on different EC2 Auto Scaling Groups.

---

# Phase 10 – Configuring the Backend Build Process

A CodeBuild project was created to build the backend Docker image and push it to ECR.

**CodeBuild project:** `Vriddhi-Backend-Build`

The project uses the Vriddhi GitHub repository as its source.

Repository:

`https://github.com/KuldeepSahoo917/Vriddhi`

The backend source is located in the backend directory.

## Backend build process

The build process performs the following operations:

1. Retrieves the source code from GitHub.
2. Authenticates Docker with Amazon ECR.
3. Builds the backend Docker image.
4. Tags the image.
5. Pushes the image to the private ECR repository.

The image is published using:

`vriddhi-backend:latest`

The first backend CodeBuild execution completed successfully.

The backend image was available in the `vriddhi-backend` ECR repository.

---

# Phase 11 – Configuring Backend Secrets in AWS Secrets Manager

The backend requires environment variables to connect to MongoDB and external services.

Instead of placing sensitive configuration directly inside the Docker image or Launch Template, AWS Secrets Manager was used.

The backend secret was created as:

`Vriddhi/Production/Backend`

Its ARN:

`arn:aws:secretsmanager:ap-south-1:001800893431:secret:Vriddhi/Production/Backend-wRDCuB`

The secret contains the backend environment configuration required by the application.

The backend EC2 instances retrieve this configuration during startup.

The secret is not exposed in the Docker image.

---

# Phase 12 – Configuring the Application Launch Template

The `Vriddhi-App-LT` Launch Template was updated with deployment automation.

The configuration includes:

| Setting | Configuration |
|---|---|
| Launch Template | `Vriddhi-App-LT` |
| Operating System | Ubuntu |
| Instance Type | `t3.small` |
| Key Pair | `Vriddhi` |
| Security Group | `Vriddhi-App-SG` |
| Storage | 20 GiB gp3 |
| Region | `ap-south-1` |
| Docker Image | `vriddhi-backend:latest` |
| Container Port | 4000 |

## Backend User Data

The User Data script was designed to automate backend deployment whenever a new App EC2 instance launches.

The script performs these operations in order:

1. Starts a log file at `/var/log/vriddhi-user-data.log`.
2. Installs Docker.
3. Installs AWS CLI and required utilities such as `jq` and `curl`.
4. Starts and enables Docker.
5. Authenticates with the ECR registry.
6. Pulls the latest backend image.
7. Retrieves the backend secret from Secrets Manager.
8. Creates the directory `/opt/vriddhi`.
9. Writes the environment configuration to `/opt/vriddhi/backend.env`.
10. Restricts the environment file permissions.
11. Starts the backend Docker container.
12. Maps host port 4000 to container port 4000.
13. Checks the backend `/health` endpoint.

The backend container is named:

`vriddhi-backend`

The application listens on port:

`4000`

## User Data troubleshooting

During testing, the initial User Data script failed to execute.

The issue was caused by an extra newline character before:

`#!/bin/bash`

The first byte of the script was `0a`, meaning the shebang was not at the beginning of the file.

This caused a cloud-init execution error:

`Exec format error`

The script was corrected by removing the leading whitespace and placing the shebang at the very beginning.

A new launch template version was created.

**Final working version:** Version 3

Version 3 was selected as the default version.

The corrected User Data successfully deployed the backend container.

---

# Phase 13 – Creating the Application Target Group

A target group was created for the backend EC2 instances.

**Target Group:** `Vriddhi-App-TG`

Configuration:

| Setting | Value |
|---|---|
| Target Type | Instances |
| Protocol | HTTP |
| Port | 4000 |
| VPC | `Vriddhi-VPC` |
| Health Check Protocol | HTTP |
| Health Check Path | `/health` |
| Success Code | 200 |

The target group checks whether the Node.js backend is healthy.

Only healthy targets should receive application traffic from the internal load balancer.

---

# Phase 14 – Creating the Internal Application Load Balancer

An internal Application Load Balancer was created for the backend tier.

**Name:** `Vriddhi-App-ALB`

Configuration:

| Setting | Value |
|---|---|
| Scheme | Internal |
| Type | Application Load Balancer |
| VPC | `Vriddhi-VPC` |
| Availability Zones | ap-south-1a and ap-south-1b |
| Subnets | Private-App-Subnet-A and Private-App-Subnet-B |
| Security Group | `Vriddhi-AppALB-SG` |

## Listener configuration

A listener was created with:

- Protocol: HTTP
- Port: 80
- Default action: Forward to `Vriddhi-App-TG`

The internal ALB DNS name is:

`internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com`

This load balancer is not publicly accessible.

It receives traffic from the Web tier and forwards it to healthy backend instances.

---

# Phase 15 – Creating the Application Auto Scaling Group

After configuring the backend Launch Template and internal ALB, the Application Auto Scaling Group was created.

**Auto Scaling Group:** `Vriddhi-App-ASG`

Configuration:

| Setting | Value |
|---|---|
| Launch Template | `Vriddhi-App-LT` |
| Launch Template Version | Version 3 |
| Instance Type | `t3.small` |
| Availability Zones | ap-south-1a and ap-south-1b |
| Subnets | Private-App-Subnet-A and Private-App-Subnet-B |
| Minimum Capacity | 2 |
| Desired Capacity | 2 |
| Maximum Capacity | 4 |
| Target Group | `Vriddhi-App-TG` |
| Health Checks | EC2 and ELB |
| Health Check Grace Period | 300 seconds |

The ASG automatically launches two backend instances in separate Availability Zones.

The instances are registered with `Vriddhi-App-TG`.

## Application tier migration

Initially, a manually configured backend EC2 instance was being used.

After the ASG instances were successfully launched and verified:

1. Both ASG instances became healthy.
2. Backend health checks succeeded.
3. The application was tested using the new backend instances.
4. Login functionality was tested successfully.
5. The original manually created backend EC2 instance was deregistered from the target group.
6. The original manual backend EC2 instance was terminated.

The Application tier was now managed by the Auto Scaling Group.

---

# Phase 16 – Preparing the Frontend Build Configuration

After completing the backend migration, the frontend build process was configured.

The frontend Docker image needed to be built and stored separately in ECR.

A frontend buildspec file was created at:

`frontend/buildspec.yml`

The file was committed and pushed to the GitHub repository.

## Frontend build process

The build process performs these operations:

1. Retrieves the frontend source code from GitHub.
2. Authenticates with Amazon ECR.
3. Builds the frontend Docker image.
4. Tags the image.
5. Pushes the image to the frontend ECR repository.

The image is published as:

`vriddhi-frontend:latest`

The frontend Docker build also receives the Google OAuth Client ID as a build argument:

`VITE_GOOGLE_CLIENT_ID`

The frontend image is stored in:

`001800893431.dkr.ecr.ap-south-1.amazonaws.com/vriddhi-frontend:latest`

The ECR push permissions were updated to allow the frontend and backend repositories to be used by the build process.

---

# Phase 17 – Creating the Frontend CodeBuild Project

A separate CodeBuild project was created for the frontend.

**Project Name:** `Vriddhi-Frontend-Build`

Configuration:

| Setting | Value |
|---|---|
| Source Provider | GitHub |
| Repository | `KuldeepSahoo917/Vriddhi` |
| Branch | `main` |
| Buildspec | `frontend/buildspec.yml` |
| Environment | Managed Ubuntu Standard 7.0 |
| Privileged Mode | Enabled |
| Build Output | Amazon ECR |

The frontend build completed successfully.

The new frontend Docker image was pushed to the `vriddhi-frontend` ECR repository.

The frontend image was now available for automated EC2 deployment.

---

# Phase 18 – Configuring the Frontend Nginx Reverse Proxy

The frontend Nginx configuration was updated to forward backend API requests to the internal Application Load Balancer.

The frontend does not communicate directly with the backend EC2 private IP addresses.

Instead, the request flow is:

`Browser → Public Web ALB → Web EC2 → Nginx → Internal App ALB → Backend EC2`

The frontend uses relative API paths such as:

`/api/auth/login`

The frontend's `VITE_API_URL` is intentionally left blank so that API requests use the same origin.

## Nginx configuration

The configuration uses an environment variable called:

`APP_ALB_DNS`

The Web container receives the internal Application Load Balancer DNS name during startup.

Nginx configuration:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://${APP_ALB_DNS};

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

This configuration ensures:

- React frontend files are served through Nginx.
- API requests are forwarded to the internal ALB.
- The internal ALB distributes requests across backend instances.
- React Router routes are handled through `index.html`.

The frontend Docker image was rebuilt and pushed to ECR with the updated configuration.

---

# Phase 19 – Configuring the Web Launch Template

The `Vriddhi-Web-LT` Launch Template was updated to automate frontend deployment.

Configuration:

| Setting | Value |
|---|---|
| Launch Template | `Vriddhi-Web-LT` |
| Operating System | Ubuntu |
| Instance Type | `t3.small` |
| Key Pair | `Vriddhi` |
| Security Group | `Vriddhi-Web-SG` |
| Storage | 20 GiB gp3 |
| Docker Image | `vriddhi-frontend:latest` |
| Container Port | 80 |
| Application Load Balancer | Internal App ALB |

## Web User Data

The User Data script automates the frontend deployment.

Its operations include:

1. Installs Docker.
2. Installs AWS CLI and required utilities.
3. Starts Docker.
4. Authenticates with Amazon ECR.
5. Pulls the frontend image.
6. Supplies the internal Application Load Balancer DNS through `APP_ALB_DNS`.
7. Starts the frontend container.
8. Maps host port 80 to container port 80.
9. Checks the frontend using a local HTTP request.

The container is named:

`vriddhi-frontend`

The Web instances use the private internal ALB DNS to forward API requests.

---

# Phase 20 – Creating the Web Target Group

A target group was created for the frontend EC2 instances.

**Target Group:** `Vriddhi-Web-TG`

Configuration:

| Setting | Value |
|---|---|
| Target Type | Instances |
| Protocol | HTTP |
| Port | 80 |
| Health Check Protocol | HTTP |
| Health Check Path | `/` |
| Success Code | 200 |

The target group checks whether Nginx is serving the frontend successfully.

---

# Phase 21 – Creating the Public Web Application Load Balancer

A public-facing Application Load Balancer was created for the frontend.

**Name:** `Vriddhi-Web-ALB`

Configuration:

| Setting | Value |
|---|---|
| Scheme | Internet-facing |
| Type | Application Load Balancer |
| VPC | `Vriddhi-VPC` |
| Availability Zones | ap-south-1a and ap-south-1b |
| Subnets | Public-Subnet-A and Public-Subnet-B |
| Security Group | `Vriddhi-WebALB-SG` |

## Listener configuration

The listener was configured as:

- Protocol: HTTP
- Port: 80
- Default action: Forward to `Vriddhi-Web-TG`

The public ALB is the entry point for application users.

It distributes incoming requests across healthy Web EC2 instances.

---

# Phase 22 – Creating the Web Auto Scaling Group

After configuring the Web Launch Template and public ALB, the Web Auto Scaling Group was created.

**Auto Scaling Group:** `Vriddhi-Web-ASG`

Configuration:

| Setting | Value |
|---|---|
| Launch Template | `Vriddhi-Web-LT` |
| Launch Template Version | Latest working default version |
| Instance Type | `t3.small` |
| Availability Zones | ap-south-1a and ap-south-1b |
| Subnets | Private-Presentation-Subnet-A and Private-Presentation-Subnet-B |
| Minimum Capacity | 2 |
| Desired Capacity | 2 |
| Maximum Capacity | 4 |
| Target Group | `Vriddhi-Web-TG` |
| Health Checks | EC2 and ELB |
| Health Check Grace Period | 300 seconds |

The Web ASG automatically launches two frontend instances in separate Availability Zones.

Both instances register with `Vriddhi-Web-TG`.

---

# Phase 23 – Configuring Web Tier Target Tracking Scaling

A target tracking scaling policy was configured for the Web Auto Scaling Group.

**Policy Name:**

`Vriddhi-Web-CPU-Target-Tracking`

Configuration:

| Setting | Value |
|---|---|
| Metric | Average CPU Utilization |
| Target Value | 50% |
| Instance Warmup | 300 seconds |
| Scale-In | Enabled |

The scaling policy allows AWS to adjust the number of Web instances based on average CPU utilization.

If CPU utilization increases above the target, the ASG can launch additional instances, up to the maximum capacity of four.

When demand decreases, the ASG can scale in while respecting its minimum capacity of two.

---

# Phase 24 – Migrating the Web Tier from Manual EC2 to ASG

Initially, the frontend was deployed on a manually configured Web EC2 instance.

After the Web Launch Template and Web ASG were configured:

1. Two Web ASG instances launched successfully.
2. Both instances registered with the Web target group.
3. Both instances passed their health checks.
4. The frontend was tested through the public Web ALB.
5. A temporary test Web EC2 instance was terminated after the ASG deployment was verified.
6. The original manually configured Web EC2 instance was also terminated after migration.

The Web tier was now managed by `Vriddhi-Web-ASG`.

---

# Phase 25 – Testing Web Auto Scaling Self-Healing

A self-healing test was performed on the Web Auto Scaling Group.

The purpose was to confirm that AWS automatically replaces an unhealthy or terminated instance.

The test procedure:

1. Confirmed that two Web ASG instances were running.
2. Confirmed that both Web target group targets were healthy.
3. One Web ASG instance was terminated manually for testing.
4. The Auto Scaling Group detected that the number of instances had fallen below desired capacity.
5. The ASG automatically launched a replacement instance.
6. The replacement instance completed its User Data deployment.
7. The replacement registered with `Vriddhi-Web-TG`.
8. The replacement passed its health checks.
9. The ASG returned to two running instances.
10. The application was tested again through the public Web ALB.

The application continued working after the replacement.

This confirmed that the Web Auto Scaling Group could automatically recover from an instance termination.

---

# Final Architecture

The Vriddhi application now uses a three-tier AWS architecture.

```text
                         INTERNET
                             |
                             |
                    Public Web ALB
                    (HTTP Port 80)
                             |
                             |
                     Vriddhi-Web-TG
                             |
                 -----------------------
                 |                     |
           Web EC2 - AZ A        Web EC2 - AZ B
                 |                     |
                 -----------------------
                             |
                       Nginx Proxy
                             |
                             |
                    Internal App ALB
                    (HTTP Port 80)
                             |
                             |
                     Vriddhi-App-TG
                             |
                 -----------------------
                 |                     |
           App EC2 - AZ A        App EC2 - AZ B
                 |                     |
                 -----------------------
                             |
                       Node.js API
                       (Port 4000)
                             |
                             |
                      MongoDB EC2
                    (Port 27017)
                    Private DB Subnet
```

## AWS Services Used

| AWS Service | Purpose |
|---|---|
| Amazon VPC | Isolated network for the application |
| EC2 | Runs frontend, backend, and MongoDB |
| Launch Templates | Defines EC2 launch configuration |
| Auto Scaling Groups | Maintains and replaces EC2 instances |
| Application Load Balancer | Distributes traffic across instances |
| Target Groups | Registers instances and performs health checks |
| Amazon ECR | Stores frontend and backend Docker images |
| AWS CodeBuild | Builds and pushes Docker images |
| AWS Secrets Manager | Stores backend environment configuration |
| Amazon CloudWatch | Provides metrics used by Auto Scaling |

## Final Configuration Summary

| Component | Resource | Configuration |
|---|---|---|
| Public Load Balancer | `Vriddhi-Web-ALB` | Internet-facing |
| Web Target Group | `Vriddhi-Web-TG` | HTTP 80, `/` |
| Web Launch Template | `Vriddhi-Web-LT` | Docker frontend deployment |
| Web Auto Scaling Group | `Vriddhi-Web-ASG` | Min 2, Desired 2, Max 4 |
| Internal Load Balancer | `Vriddhi-App-ALB` | Internal |
| App Target Group | `Vriddhi-App-TG` | HTTP 4000, `/health` |
| App Launch Template | `Vriddhi-App-LT` | Version 3 |
| App Auto Scaling Group | `Vriddhi-App-ASG` | Min 2, Desired 2, Max 4 |
| Frontend ECR | `vriddhi-frontend` | Frontend Docker image |
| Backend ECR | `vriddhi-backend` | Backend Docker image |
| Frontend CodeBuild | `Vriddhi-Frontend-Build` | Frontend image build |
| Backend CodeBuild | `Vriddhi-Backend-Build` | Backend image build |
| Database | MongoDB EC2 | Private DB subnet |

## Deployment Architecture Achievements

- Migrated the backend from a manually configured EC2 instance to an Auto Scaling Group.
- Migrated the frontend from a manually configured EC2 instance to an Auto Scaling Group.
- Created separate private ECR repositories for frontend and backend.
- Configured separate CodeBuild projects for frontend and backend Docker images.
- Automated backend Docker deployment using EC2 User Data.
- Automated frontend Docker deployment using EC2 User Data.
- Configured backend secrets retrieval through AWS Secrets Manager.
- Configured Nginx to forward API requests to the internal Application Load Balancer.
- Configured separate public and internal Application Load Balancers.
- Distributed frontend and backend instances across two Availability Zones.
- Configured health checks for both application tiers.
- Configured CPU-based target tracking for the Web ASG.
- Successfully tested automatic Web instance replacement.

