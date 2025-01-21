'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TestPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [routerData, setRouterData] = useState<any>(null);

  useEffect(() => {
    // get router data from search params
    const routerParams = Object.fromEntries(searchParams.entries());
    setRouterData(routerParams);

    const fetchData = async () => {
      try {
        const response = await fetch('https://gist.githubusercontent.com/Kudostoy0u/884c863c4d77081fb83f89ca831f1c7f/raw/4c7c815a474127e95d3776a061c076bf7c05bb8c/dataset.json');
        const jsonData = await response.json();
        const eventName = routerParams.eventName;
        const questionCount = parseInt(routerParams.questionCount);
        const difficulty = routerParams.difficulty === 'easy' ? 0.33 : 
          routerParams.difficulty === 'medium' ? 0.66 : 
          routerParams.difficulty === 'hard' ? 1 : 0.33;
        const category = routerParams.category;


      
        if (eventName && jsonData[eventName]) {
          const eventData = jsonData[eventName];
          const filteredByDifficulty = eventData.filter((q: { difficulty: number; }) => q.difficulty >= (difficulty - 0.33) && q.difficulty <= difficulty);
          let filteredByType = filteredByDifficulty;
          if (category === 'multiple-choice') {
            filteredByType = filteredByDifficulty.filter((q: { options: any[] }) => q.options && q.options.length > 0);
          }
          const shuffled = [...filteredByType].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, questionCount);
          setData(selected);
        } else {
          setData(null);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-cyan-500 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
        <div className="w-4 h-4 bg-cyan-500 rounded-full animate-bounce delay-400"></div>
      </div>
    </div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Test Page</h1>
      
      <div className="mb-4">
        <h2 className="font-bold">Router Data:</h2>
        <pre>{JSON.stringify(routerData, null, 2)}</pre>
      </div>

      <div>
        <h2 className="font-bold">Fetched Data:</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}