// Test file to verify TypeScript + React setup
import React from 'react'

// Test component to verify TSX compilation
export const TestComponent: React.FC<{ message: string }> = ({ message }) => {
  return <div>{message}</div>
}

// Test TypeScript features
interface User {
  id: number
  name: string
  email: string
}

const testUser: User = {
  id: 1,
  name: "Test User",
  email: "test@example.com"
}

console.log("TypeScript setup test passed:", testUser)