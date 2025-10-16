import { motion } from 'framer-motion';

interface Step {
    title: string;
    description: string;
}

interface StepNavigatorProps {
    steps: Step[];
    currentStep: number;
    setCurrentStep: (step: number) => void;
}

export default function StepNavigator({ steps, currentStep, setCurrentStep }: StepNavigatorProps) {
    return (
        <div className="mb-6 flex items-center justify-between">
            {steps.map((step, idx) => (
                <motion.div
                    key={step.title}
                    className="flex-1 cursor-pointer text-center"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCurrentStep(idx)}
                >
                    <motion.div
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full font-bold transition-colors duration-300 ${
                            idx === currentStep
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'border border-border bg-muted text-muted-foreground'
                        } `}
                        layout
                        initial={false}
                        animate={idx === currentStep ? { scale: 1.15, boxShadow: '0 0 0 4px var(--color-primary)' } : { scale: 1, boxShadow: 'none' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        {idx + 1}
                    </motion.div>
                    <motion.div
                        className="mt-2 text-sm font-semibold text-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        {step.title}
                    </motion.div>
                    <motion.div
                        className="text-xs text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07 }}
                    >
                        {step.description}
                    </motion.div>
                </motion.div>
            ))}
        </div>
    );
}
