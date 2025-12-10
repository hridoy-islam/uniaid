

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { QuizQuestion } from "@/components/shared/quiz-question"
import { CircularProgress } from "@/components/shared/circular-progress"
import { StudentFormData, initialFormData, questions } from "@/types/index"
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

export function StudentQuiz() {
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState<StudentFormData>(initialFormData)

    const currentQuestion = questions[currentStep]
    const progress = (currentStep + 1) / questions.length

    const updateField = (value: string) => {
        setFormData(prev => ({ ...prev, [currentQuestion.id]: value }))
    }

    const next = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const back = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Here you would typically send the data to your backend
    }

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                    >
                        <Link to='/admin/students/'>
                            <ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <h1 className="text-2xl font-semibold">Add New Student</h1>
                </div>
            </div>
            <Card className="mx-auto px-4 p-6">

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex items-center justify-between">
                        <CircularProgress progress={progress} />
                        <span className="text-sm font-medium text-gray-500">
                            Question {currentStep + 1} of {questions.length}
                        </span>
                    </div>
                    <AnimatePresence mode="wait">
                        <QuizQuestion
                            key={currentQuestion.id}
                            question={currentQuestion}
                            value={formData[currentQuestion.id]}
                            onChange={updateField}
                        />
                    </AnimatePresence>

                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={back}
                            disabled={currentStep === 0}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" /> Previous
                        </Button>
                        {currentStep === questions.length - 1 ? (
                            <Button type="submit" className="bg-[#1e40af] flex items-center gap-2">
                                Submit
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="bg-[#1e40af] flex items-center gap-2"
                                onClick={next}
                            >
                                Next <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </>
    )
}

