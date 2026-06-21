import { ApiError } from "@/lib/api/errors"
import { deleteDriver, getDriver } from "@/lib/api/services/drivers"
import { deleteUser } from "@/lib/api/services/users"

/**
 * Remove motorista e conta vinculada.
 * Backend (hard delete): apaga tm_drivers + tm_users; histórico mantém driver_nome com driver_id NULL.
 */
export async function deleteDriverWithAccount(driverId: string): Promise<void> {
  let userId: string | null | undefined
  try {
    const driver = await getDriver(driverId)
    userId = driver.user_id
  } catch {
    /* motorista já removido ou inacessível */
  }

  await deleteDriver(driverId)

  if (userId) {
    try {
      await deleteUser(userId)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return
      throw error
    }
  }
}
