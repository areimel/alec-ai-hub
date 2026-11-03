import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqAccordionProps {
  items: { id: string; question: string; answer: string }[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="faq-list">
      {items.map(({ id, question, answer }) => (
        <AccordionItem key={id} value={id}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>
            <p className="faq-list__answer">{answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
