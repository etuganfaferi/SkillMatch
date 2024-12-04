import { v4 as uuidv4 } from "uuid";
import { StableBTreeMap } from "azle";
import express from "express";
import { time } from "azle";

/**
 * jobStorage - A key-value data structure to store job postings.
 * {@link StableBTreeMap} ensures durable data storage across canister upgrades.
 */
class Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  clientId: string;
  freelancerId: string | null;
  status: "open" | "in_progress" | "completed";
  createdAt: Date;
  updatedAt: Date | null;
}

const jobStorage = StableBTreeMap<string, Job>(0);

const app = express();
app.use(express.json());

// Create a new job posting
app.post("/jobs", (req, res) => {
  const job: Job = {
    id: uuidv4(),
    createdAt: getCurrentDate(),
    status: "open",
    ...req.body,
  };
  jobStorage.insert(job.id, job);
  res.json(job);
});

// Retrieve all job postings
app.get("/jobs", (req, res) => {
  res.json(jobStorage.values());
});

// Retrieve a specific job posting by ID
app.get("/jobs/:id", (req, res) => {
  const jobId = req.params.id;
  const job = jobStorage.get(jobId);
  if (!job) {
    res.status(404).send(`Job with ID ${jobId} not found`);
  } else {
    res.json(job);
  }
});

// Update a job posting by ID
app.put("/jobs/:id", (req, res) => {
  const jobId = req.params.id;
  const job = jobStorage.get(jobId);
  if (!job) {
    res.status(404).send(`Job with ID ${jobId} not found`);
  } else {
    const updatedJob = {
      ...job,
      ...req.body,
      updatedAt: getCurrentDate(),
    };
    jobStorage.insert(jobId, updatedJob);
    res.json(updatedJob);
  }
});

// Delete a job posting by ID
app.delete("/jobs/:id", (req, res) => {
  const jobId = req.params.id;
  const deletedJob = jobStorage.remove(jobId);
  if (!deletedJob) {
    res.status(404).send(`Job with ID ${jobId} not found`);
  } else {
    res.json(deletedJob);
  }
});

app.listen();

function getCurrentDate() {
  const timestamp = new Number(time());
  return new Date(timestamp.valueOf() / 1000_000);
}
