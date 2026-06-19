import { ApiError } from "@/lib/api/errors"
import { createDriver, updateDriver } from "@/lib/api/services/drivers"
import { createUser } from "@/lib/api/services/users"
import type { Driver } from "@/types"

export type CreateDriverAccountInput = {
  driver: Omit<Driver, "id" | "created_at" | "tenant_id">
  email: string
  provisionalPassword: string
}

export type CreateDriverAccountResult = {
  driver: Driver
  provisionalPassword: string
}

/**
 * Cadastro operacional + conta de acesso em um único fluxo.
 * Cria motorista, usuário (role motorista) e vincula user_id no cadastro.
 */
export async function createDriverWithAccount(
  input: CreateDriverAccountInput,
): Promise<CreateDriverAccountResult> {
  const email = input.email.trim().toLowerCase()
  const driverPayload = { ...input.driver, email }

  const driver = await createDriver(driverPayload)

  if (driver.temporary_password) {
    return { driver, provisionalPassword: driver.temporary_password }
  }

  try {
    const user = await createUser({
      nome: input.driver.name,
      email,
      password: input.provisionalPassword,
      role: "motorista",
      is_active: true,
      driver_id: driver.id,
    })

    const linked = await updateDriver(driver.id, {
      user_id: user.id,
      email,
    })

    return { driver: linked, provisionalPassword: input.provisionalPassword }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new Error("E-mail já cadastrado. Use outro e-mail de login.")
    }
    throw error
  }
}
