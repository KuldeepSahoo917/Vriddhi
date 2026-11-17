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

The Database Tier does not have a default internet route through the NAT Gateway. This restricts general outbound internet connectivity while allowing internal communication within the VPC.

---

## Phase 1 – Networking Summary

| AWS Component | Configuration |
|---|---|
| VPC | 1 |
| Availability Zones | 2 |
| Public Subnets | 2 |
| Private Subnets | 6 |
| Internet Gateway | 1 |
| NAT Gateway | 1 |
| Public Route Table | 1 |
| Private Route Tables | 3 |

### Network Routing Summary

| Tier | Route Table | Internet Connectivity |
|---|---|---|
| Public | `Vriddhi-Public-RT` | Through IGW |
| Presentation | `Vriddhi-Private-Presentation-RT` | Through NAT Gateway |
| Application | `Vriddhi-Private-App-RT` | Through NAT Gateway |
| Database | `Vriddhi-DB-RT` | No direct internet route |

---

## Next Phases

The following implementation phases are planned:

- [ ] **Phase 2:** Security Configuration – Security Groups, inbound/outbound rules, and access management.
- [ ] **Phase 3:** Database Tier – MongoDB deployment and database configuration.
- [ ] **Phase 4:** Application Tier – Node.js and Express backend deployment.
- [ ] **Phase 5:** Presentation Tier – React and Nginx deployment.
- [ ] **Phase 6:** Load Balancing and High Availability – Application Load Balancer, Target Groups, and Auto Scaling.
- [ ] **Phase 7:** Monitoring and Logging – Amazon CloudWatch, metrics, logs, and alarms.
- [ ] **Phase 8:** CI/CD Pipeline – Automated build and deployment.
- [ ] **Phase 9:** Application Testing – End-to-end connectivity, availability, and security validation.

---

**Project:** Vriddhi  
**Cloud Provider:** Amazon Web Services (AWS)  
**Region:** Asia Pacific (Mumbai) – `ap-south-1`  
**Architecture:** Three-Tier Architecture  
**Networking:** Multi-AZ VPC Architecture