export function ApprenticeshipExplainer() {
  return (
    <div className="my-8 p-6 bg-brand-green-50 border-l-4 border-brand-green-600 rounded-r-lg">
      <h3 className="text-xl font-bold text-brand-green-900 mb-3">
        Earn While You Learn Apprenticeship
      </h3>
      <p className="text-brand-green-800 mb-4">
        This is an Earn While You Learn apprenticeship program.
      </p>

      <div className="mb-4">
        <p className="text-brand-green-900 font-semibold mb-2">You will:</p>
        <ul className="space-y-2 text-brand-green-800">
          <li className="flex items-start">
            <span className="text-brand-green-600 font-bold mr-2">•</span>
            Train inside a licensed barbershop
          </li>
          <li className="flex items-start">
            <span className="text-brand-green-600 font-bold mr-2">•</span>
            Log required on-the-job hours
          </li>
          <li className="flex items-start">
            <span className="text-brand-green-600 font-bold mr-2">•</span>
            Complete online theory coursework
          </li>
          <li className="flex items-start">
            <span className="text-brand-green-600 font-bold mr-2">•</span>
            Earn income based on your shop's pay structure (hourly, commission,
            tips)
          </li>
        </ul>
      </div>

      <p className="text-brand-green-800 text-sm">
        Workforce funding may cover tuition costs while you work and train. Your
        WorkOne advisor will confirm eligibility and funding options.
      </p>
    </div>
  );
}
