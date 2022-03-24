import { api, data, storage, schedule, events } from "@serverless/cloud";
import { Employee } from "./models/Employee";
import { v4 as uuidv4 } from 'uuid';

api.get("/employees", async (req, res) => {
  let result = await data.get("employee:*", true);
  res.send({
    employees: result.items,
  });
});

api.get("/employees/:id", async (req, res) => {
  let key = "employee:" + req.params.id
  let result = await data.get(key);
  res.send({
    employee: result,
  });
});

api.post("/employees", async (req, res) => {
  let employee: Employee = req.body;
  let id: number = uuidv4();
  await data.set(
    'employee:' + id,
    employee
  )

  events.publish("employee.created", {
    name: employee.name
  })

  res.send({
    employeeId: id,
  });
});

api.post("/employees/:id/cv", async (req, res) => {
  let key = "employee:" + req.params.id
  let employee = await data.get(key);
  let filepath: string = '/cv/' + req.params.id + '.txt'
  
  await storage.write(filepath, req.body)
  	
  let downloadUrl = await storage.getDownloadUrl(filepath);

  employee.cvUrl = downloadUrl;

  await data.set(
    key,
    employee,
    true
  )

  res.send({
    downloadUrl
  });
});

storage.on("write:cv/*", async (event) => {
  console.log('File has been uploaded, scanning for virus: ' + event.path)
});

schedule.every("1 day", () => {
  console.log("Doing some sort of cleanup task every night");
});

	
events.on("employee.created", async ({ body }) => {
  console.log('Send welcome email to ' + body.name)
});
