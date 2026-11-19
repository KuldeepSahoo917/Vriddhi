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


---
