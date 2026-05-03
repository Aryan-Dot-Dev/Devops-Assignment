# ANSWERS.md

## Q1. Containers vs Virtual Machines

A container shares the host OS kernel and isolates processes using namespaces and cgroups, whereas a virtual machine includes a full guest OS running on a hypervisor. Containers are lightweight, start quickly, and are ideal for microservices and CI/CD workflows. VMs provide stronger isolation and are better suited when running different OS types or for strict security boundaries. In practice, containers are preferred for scalable application deployment, while VMs are used for infrastructure-level isolation.

---

## Q2. Image Layers

Combining multiple `RUN` commands into a single layer reduces the total number of image layers, which decreases image size and improves build efficiency. Each Docker layer adds metadata and filesystem overhead. However, the trade-off is reduced caching granularity—if one part of the combined command changes, the entire layer must be rebuilt instead of reusing cached steps. This can slow down incremental builds.

---

## Q3. Secrets Management

Immediate remediation:

* Remove the secret from the Dockerfile
* Rotate the exposed credentials
* Remove it from Git history (e.g., using `git filter-repo` or BFG)

Long-term prevention:

* Use environment variables or secret managers (GitHub Secrets, AWS Secrets Manager)
* Never bake secrets into images
* Add `.env` to `.gitignore`
* Implement secret scanning in CI

---

## Q4. CI/CD Failure

Automated safeguards:

* Health checks after deployment
* Canary or blue-green deployments
* Automated rollback on failed health checks
* Require CI to pass before CD triggers

Rollback strategy:

* Re-deploy the last known good image (tagged by commit SHA)
* Use immutable image tags for traceability
* Maintain versioned deployments for quick recovery

---

## Q5. Stateless vs Stateful

A stateless API does not store data locally, so it can be horizontally scaled easily by adding more instances behind a load balancer. A stateful database maintains persistent data and requires careful handling, including replication, backups, and storage management. Stateless services can be replaced or restarted freely, while stateful services require data consistency and durability guarantees.

---

## Q6. Infrastructure as Code

Infrastructure as Code means defining infrastructure in version-controlled files, enabling reproducibility, automation, and consistency across environments. It eliminates manual configuration drift and allows infrastructure changes to be reviewed, tested, and rolled back like application code. It also enables automated provisioning and scaling, which is not possible through manual cloud console interactions.

---

## Q7. Observability

Logs record discrete events, metrics provide aggregated numerical data over time, and traces show the flow of requests across services. If an API is slow, metrics are checked first to identify latency patterns and bottlenecks. Logs are then used for detailed debugging, and traces help understand request paths in distributed systems. Metrics provide the fastest signal for performance issues.
