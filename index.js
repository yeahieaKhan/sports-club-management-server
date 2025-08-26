const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();
const port = 8000;
const stripe = Stripe(process.env.PAYMENT_KEY);
// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("sports_club_management");
    const usersCollections = db.collection("users");
    const courtsCollection = db.collection("courts");
    const bookingCollection = db.collection("booking");
    const announcementsCollection = db.collection("announcements");
    const paymentCollection = db.collection("payments");

    // user related api

    //courts related api

    // API: Get all users with role "user"
    app.get("/api/users", async (req, res) => {
      try {
        const usersCollections = db.collection("users");
        const users = await usersCollections.find({ role: "user" }).toArray();
        res.status(200).json(users);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });
    // API: Get all users with role "user"
    app.get("/api/members", async (req, res) => {
      try {
        const usersCollections = db.collection("users");
        const users = await usersCollections.find({ role: "member" }).toArray();
        res.status(200).json(users);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const userExist = await usersCollections.findOne({ email });
      if (userExist) {
        return res
          .status(200)
          .send({ message: "User already exist", inserted: false });
      }
      const user = req.body;
      const result = await usersCollections.insertOne(user);
      res.send(result);
    });
    // GET /users/role/user
    app.get("/users/role/user", async (req, res) => {
      try {
        const users = await usersCollections.find({ role: "user" }).toArray();
        res.send(users);
      } catch (error) {
        console.error("Error fetching users with role 'user':", error);
        res.status(500).send({ message: "Server error while fetching users." });
      }
    });
    // GET /users/role/user
    app.get("/users/role/member", async (req, res) => {
      try {
        const users = await usersCollections.find({ role: "member" }).toArray();
        res.send(users);
      } catch (error) {
        console.error("Error fetching users with role 'user':", error);
        res.status(500).send({ message: "Server error while fetching users." });
      }
    });

    // GET /users/search?email=sohag
    app.get("/users/search", async (req, res) => {
      const emailQuery = req.query.email;

      if (!emailQuery) {
        return res
          .status(400)
          .json({ message: "Please provide an email to search." });
      }

      const query = {
        email: { $regex: emailQuery, $options: "i" },
        role: "user", //
      };

      try {
        const users = await usersCollections.find(query).toArray();
        res.json(users);
      } catch (error) {
        console.error("User search error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /users/:email/role
    app.get("/users/:email/role", async (req, res) => {
      const email = req.params.email;

      if (!email) {
        return res
          .status(400)
          .send({ message: "Email parameter is required." });
      }

      try {
        const user = await usersCollections.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }

        res.send({ role: user.role });
      } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    });

    // GET /users/member?email=example@gmail.com
    app.get("/users/role-member", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      try {
        const member = await usersCollections.findOne({
          email,
          role: "member",
        });

        if (!member) {
          return res.status(404).json({ message: "Member not found" });
        }

        res.status(200).json(member);
      } catch (error) {
        console.error("Error fetching specific member:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // member management

    app.get("/users", async (req, res) => {
      const role = req.query.role;
      const query = role ? { role } : {};
      const users = await usersCollections.find(query).toArray();
      res.send(users);
    });

    // DELETE role is member
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const memberId = { _id: new ObjectId(id) };
      try {
        const result = await usersCollections.deleteOne(memberId);

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "User deleted successfully" });
        } else {
          res.status(404).send({ success: false, message: "User not found" });
        }
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    //courts related api

    app.get("/courts", async (req, res) => {
      try {
        const courts = await courtsCollection.find().toArray();
        res.send(courts);
      } catch (error) {
        console.error("Error fetching courts:", error);
        res.status(500).send("Error fetching courts");
      }
    });

    app.get("/adminCourts", async (req, res) => {
      const email = req.query.email;

      try {
        if (!email) {
          return res
            .status(400)
            .json({ error: "Email query parameter is required" });
        }

        const userCourts = await courtsCollection
          .find({ created_by: email })
          .toArray();
        res.json(userCourts);
      } catch (error) {
        console.error("Error fetching user courts:", error);
        res.status(500).send("Error fetching user-specific courts");
      }
    });
    // Add a court (POST)
    app.post("/courts", async (req, res) => {
      const court = req.body;
      const result = await courtsCollection.insertOne(court);
      res.send(result);
    });

    //courts deleted
    app.delete("/courts/:id", async (req, res) => {
      const courtId = req.params.id;
      console.log("Delete request for court:", courtId);

      try {
        const result = await courtsCollection.deleteOne({
          _id: new ObjectId(courtId),
        });

        if (result.deletedCount === 0) {
          console.log("No court found with this ID");
          return res.status(404).send({ error: "Court not found" });
        }

        res.send({ message: "Court deleted successfully" });
      } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Failed to delete court" });
      }
    });

    app.patch("/courts/:id", async (req, res) => {
      const courtId = req.params.id;
      const email = req.query.email; // user email
      const updateData = req.body;

      try {
        const result = await courtsCollection.updateOne(
          { _id: new ObjectId(courtId), created_by: email }, // <-- change here
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Court not found" });
        }

        res.send({ message: "Court updated successfully", result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Update failed", error });
      }
    });

    // booking related api

    // GET /bookings/pending
    app.get("/manage/booking", async (req, res) => {
      try {
        const pendingBookings = await bookingCollection
          .find({ status: "pending" })
          .toArray();

        res.send(pendingBookings);
      } catch (error) {
        console.error("Error fetching pending bookings:", error);
        res
          .status(500)
          .send({ message: "Server error while fetching pending bookings." });
      }
    });

    // pending booking filter by email

    app.get("/pending/bookingStatus", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const pendingBookings = await bookingCollection
          .find({ status: "pending", email })
          .toArray();

        res.send(pendingBookings);
      } catch (error) {
        console.error("Error fetching pending bookings:", error);
        res.status(500).send({
          message: "Server error while fetching pending bookings.",
        });
      }
    });

    // GET /bookings/approved
    app.get("/approved/booking", async (req, res) => {
      const { email } = req.query;
      console.log(email);
      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }
      try {
        const approvedBookings = await bookingCollection
          .find({ status: "approved", payment_status: "unpaid", email })
          .toArray();

        res.status(200).json(approvedBookings);
      } catch (error) {
        console.error("Error fetching approved bookings:", error);
        res.status(500).json({ message: "Failed to load approved bookings" });
      }
    });

    // // GET /bookings/confirmed?search=optionalTitle in admin page

    // GET /confirmed-booking
    app.get("/confirmed-booking", async (req, res) => {
      try {
        const confirmedBookings = await bookingCollection
          .find({ payment_status: "paid" })
          .sort({ paymentDate: -1 }) // optional: newest first
          .toArray();

        res.status(200).json(confirmedBookings);
      } catch (error) {
        console.error("Error fetching confirmed bookings:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /confirmed-booking?email=email@example.com
    app.get("/confirmed-booking-members", async (req, res) => {
      const { email } = req.query;

      const query = {
        payment_status: "paid",
      };

      if (email) {
        query.email = email; // Filter by email if provided
      }

      try {
        const confirmedBookings = await bookingCollection
          .find(query)
          .sort({ paymentDate: -1 }) // Sorting by paymentDate in descending order
          .toArray();

        res.status(200).json(confirmedBookings);
      } catch (error) {
        console.error("Error fetching confirmed bookings:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // POST /bookings
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // PATCH /bookings/:id
    app.patch("/bookings/:id", async (req, res) => {
      const bookingId = req.params.id;
      const { status, email, payment_status } = req.body;

      // Input validation
      if (!status) {
        return res.status(400).send({ message: "Status is required" });
      }
      if (!payment_status) {
        return res.status(400).send({ message: "Payment status is required" });
      }

      try {
        // Update booking status and payment_status
        const result = await bookingCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          {
            $set: {
              status: status,
              payment_status: payment_status,
            },
          }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ message: "Booking not found or already updated" });
        }

        // If approved, promote user to "member"
        if (status === "approved") {
          const userQuery = { email };
          const userUpdatedDoc = {
            $set: {
              role: "member",
              joined_at: new Date().toISOString(),
            },
          };

          const roleResult = await usersCollections.updateOne(
            userQuery,
            userUpdatedDoc
          );
          console.log("User role updated:", roleResult.modifiedCount);
        }

        res.send({
          message: `Booking updated successfully`,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Booking status update error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET: Get booking by ID
    app.get("/booking/:id", async (req, res) => {
      const bookingId = req.params.id;
      try {
        const booking = await bookingCollection.findOne({
          _id: new ObjectId(bookingId),
        });

        if (!booking) {
          return res.status(404).send({ message: "Booking not found" });
        }

        res.status(200).json(booking);
      } catch (error) {
        res.status(500).send({ message: "Server error", error });
      }
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const bookingId = { _id: new ObjectId(id) };

      try {
        const result = await bookingCollection.deleteOne(bookingId);
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Booking not found" });
        }

        res.send({ message: "Booking deleted successfully" });
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //Make Announcement Related api
    // ADD new announcement
    app.post("/announcements", async (req, res) => {
      const announcement = req.body;
      const result = await announcementsCollection.insertOne(announcement);
      res.send(result);
    });

    // GET all announcements (latest first)
    app.get("/announcements", async (req, res) => {
      try {
        const result = await announcementsCollection
          .find()
          .sort({ posted_at: -1 })
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch announcements" });
      }
    });

    // DELETE /announcements/:id
    app.delete("/announcements/:id", async (req, res) => {
      const id = req.params.id;
      const deletedCount = { _id: new ObjectId(id) };
      console.log(deletedCount);
      try {
        const result = await announcementsCollection.deleteOne(deletedCount);
        res.status(200).send({ message: "Announcement deleted", result });
      } catch (err) {
        res.status(500).send({ error: "Failed to delete announcement" });
      }
    });

    // UPDATE announcement by ID
    app.patch("/announcements/:id", async (req, res) => {
      const id = req.params.id;
      const updateId = { _id: new ObjectId(id) };
      const updateFields = req.body;
      const query = {
        $set: {
          ...updateFields,
          updated_at: new Date(),
        },
      };

      try {
        const result = await announcementsCollection.updateOne(updateId, query);

        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Announcement updated" });
        } else {
          res
            .status(404)
            .send({ message: "Announcement not found or nothing to update" });
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to update announcement" });
      }
    });

    // payment gateway
    app.post("/create-payment-intent", async (req, res) => {
      const amountInCents = req.body.amountInCents;
      console.log(amountInCents);
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents, // amount in cents
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/payments", async (req, res) => {
      try {
        const { id, email, amount, transactionId } = req.body.paymentData;

        // Check if data is missing
        if (!id || !email || !amount || !transactionId) {
          return res.status(400).json({ error: "Missing payment details" });
        }

        // 1. Mark booking as paid
        const bookingUpdateResult = await bookingCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              payment_status: "paid",
            },
          }
        );

        // 2. Save payment record
        const paymentData = {
          id: new ObjectId(id),
          email,
          amount,
          transactionId,
          paymentDate: new Date(),
        };

        const paymentInsertResult = await paymentCollection.insertOne(
          paymentData
        );

        res.status(200).json({
          message: "Payment recorded and booking marked as paid",
          insertedId: paymentInsertResult.insertedId,
          bookingUpdateResult,
        });
      } catch (error) {
        console.error("Payment API error:", error.message);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // GET /payment-history?email=user@example.com
    app.get("/payment-history", async (req, res) => {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      try {
        const paymentHistory = await paymentCollection
          .find({ email })
          .sort({ paymentDate: -1 }) // sort latest first
          .toArray();

        res.status(200).json(paymentHistory);
      } catch (error) {
        console.error("Error fetching payment history:", error);
        res.status(500).json({ message: "Failed to fetch payment history" });
      }
    });

    // database connection

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
