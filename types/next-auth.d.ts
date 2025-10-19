import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
    department?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      department?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    department?: string
  }
}
