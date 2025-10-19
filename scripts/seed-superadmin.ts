import { connectDB } from "../lib/mongodb"
import { User } from "../lib/models/User"

async function seedSuperAdmin() {
  try {
    await connectDB()

    const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" })

    if (existingSuperAdmin) {
      console.log("SuperAdmin already exists")
      return
    }

    const superAdmin = await User.create({
      name: "Super Admin",
      email: "admin@company.com",
      password: "admin123",
      role: "SuperAdmin",
    })

    console.log("SuperAdmin created successfully:", superAdmin.email)
    console.log("Password: admin123")
  } catch (error) {
    console.error("Error seeding SuperAdmin:", error)
  }
}

seedSuperAdmin()
