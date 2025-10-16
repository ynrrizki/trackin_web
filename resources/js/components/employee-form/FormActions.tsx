import { Button } from '@/components/ui/button';

interface FormActionsProps {
    currentStep: number;
    totalSteps: number;
    processing: boolean;
    onPrevStep: () => void;
    onNextStep: () => void;
    submitText?: string;
}

export default function FormActions({ currentStep, totalSteps, processing, onPrevStep, onNextStep, submitText = 'Simpan' }: FormActionsProps) {
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;

    const handleNext: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // tunda 1 tick biar DOM update setelah event selesai
        requestAnimationFrame(() => onNextStep());
    };

    return (
        <div className="mt-8 flex justify-between">
            <Button type="button" variant="outline" onClick={onPrevStep} disabled={isFirst || processing}>
                Sebelumnya
            </Button>
            {/* {currentStep < totalSteps - 1 ? (
                <Button type="button" onClick={onNextStep}>
                    Selanjutnya →
                </Button>
            ) : (
                <Button type="submit" variant="default" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan'}
                </Button>
            )} */}
            {isLast ? (
                <Button type="submit" variant="default" disabled={processing}>
                    {processing ? 'Menyimpan...' : submitText}
                </Button>
            ) : (
                <Button type="button" onClick={handleNext}>
                    Selanjutnya →
                </Button>
            )}
        </div>
    );
}
