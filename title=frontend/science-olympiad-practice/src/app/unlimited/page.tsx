  // When "Next Question" is clicked, load a random question.
  const handleNext = () => {
    const randomIndex = Math.floor(Math.random() * data.length);
    setCurrentQuestionIndex(randomIndex);
    setCurrentAnswer([]);
    setIsSubmitted(false);
  }; 