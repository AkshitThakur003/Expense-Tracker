import { useSelector } from 'react-redux'

const Profile = () => {
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Profile
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <div className="text-gray-900 dark:text-white font-medium">
              {user?.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="text-gray-900 dark:text-white font-medium">
              {user?.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

