import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/layout/Dashboard';
import { BooksLibrary } from './components/layout/BooksLibrary';
import { TestWorkspace } from './components/test/TestWorkspace';
import { DeckOverview } from './components/flashcards/DeckOverview';
import { ProgressAnalytics } from './components/analytics/ProgressAnalytics';
import { SpeakingExaminer } from './components/speaking/SpeakingExaminer';
import { getTestData } from './data/catalog';

export function App() {
  const [currentTab, setCurrentTab] = React.useState<
    'dashboard' | 'test' | 'reading' | 'listening' | 'speaking' | 'flashcards' | 'analytics' | 'books'
  >('dashboard');
  
  const [selectedBook, setSelectedBook] = React.useState<number>(15);
  const [selectedTest, setSelectedTest] = React.useState<number>(1);
  const [selectedModule, setSelectedModule] = React.useState<'full' | 'listening' | 'reading'>('full');

  const activeTestData = React.useMemo(() => {
    return getTestData(selectedBook, selectedTest);
  }, [selectedBook, selectedTest]);

  const handleStartExam = (module: 'full' | 'listening' | 'reading', book: number = selectedBook, test: number = 1) => {
    setSelectedBook(book);
    setSelectedTest(test);
    setSelectedModule(module);
    if (module === 'full') setCurrentTab('test');
    else if (module === 'listening') setCurrentTab('listening');
    else if (module === 'reading') setCurrentTab('reading');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Primary Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        selectedBook={selectedBook}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {currentTab === 'dashboard' && (
          <Dashboard
            currentBook={selectedBook}
            onStartExam={handleStartExam}
            onOpenDeck={() => setCurrentTab('flashcards')}
            onOpenAnalytics={() => setCurrentTab('analytics')}
            onOpenBooks={() => setCurrentTab('books')}
          />
        )}

        {currentTab === 'books' && (
          <BooksLibrary
            selectedBook={selectedBook}
            onSelectBookAndTest={(book, test, module) => {
              handleStartExam(module, book, test);
            }}
          />
        )}

        {currentTab === 'test' && (
          <TestWorkspace
            key={`test-${selectedBook}-${selectedTest}-${selectedModule}`}
            testData={activeTestData}
            initialModule="full"
            onFinishedTest={() => setCurrentTab('analytics')}
          />
        )}

        {currentTab === 'listening' && (
          <TestWorkspace
            key={`listening-${selectedBook}-${selectedTest}`}
            testData={activeTestData}
            initialModule="listening"
            onFinishedTest={() => setCurrentTab('analytics')}
          />
        )}

        {currentTab === 'reading' && (
          <TestWorkspace
            key={`reading-${selectedBook}-${selectedTest}`}
            testData={activeTestData}
            initialModule="reading"
            onFinishedTest={() => setCurrentTab('analytics')}
          />
        )}

        {currentTab === 'speaking' && <SpeakingExaminer />}

        {currentTab === 'flashcards' && <DeckOverview />}

        {currentTab === 'analytics' && <ProgressAnalytics />}
      </main>
    </div>
  );
}

export default App;
