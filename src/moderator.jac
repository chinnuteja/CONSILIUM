import from schema { Patient }
import from specialists.cardiology { CardiologyWalker }
import from specialists.endocrinology { EndocrinologyWalker }

walker ModeratorWalker {
    has cardiology: dict = {};
    has endocrinology: dict = {};
    has logs: list[str] = [];

    can moderate with Patient entry {
        here.phase = "INITIAL";
        cardiology_walker = here spawn CardiologyWalker();
        endocrinology_walker = here spawn EndocrinologyWalker();
        here.phase = "DEBATE";
        self.cardiology = cardiology_walker.hypothesis;
        self.endocrinology = endocrinology_walker.hypothesis;
        self.logs = cardiology_walker.llm_call_log + endocrinology_walker.llm_call_log;
    }
}
