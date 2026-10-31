import { createDriverAccount } from "@/lib/api/services/drivers"
import type { Driver } from "@/types"

export type CreateAccountForDriverResult = {
  driver: Driver
  provisionalPassword: string
}

/**
 * Cria conta de acesso para motorista já cadastrado (admin).
 * Usa POST /drivers/{id}/account — não cria usuário via POST /users.
 */
export async function createAccountForDriver(
  driverId: string,
  email: string,
  password: string,
): Promise<CreateAccountForDriverResult> {
  const driver = await createDriverAccount(driverId, {
    email: email.trim().toLowerCase(),
    password,
  })

  const provisionalPassword = driver.temporary_password ?? password
  return { driver, provisionalPassword }
}
