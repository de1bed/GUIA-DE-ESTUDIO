"""Browser-level smoke tests for the local learning portal."""
from pathlib import Path
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

root = Path(__file__).resolve().parent
url = (root / "index.html").as_uri() + "?mode=source"
options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1440,1000")
options.add_argument("--disable-gpu")
driver = webdriver.Chrome(options=options)

def click(selector):
    element = driver.find_element(By.CSS_SELECTOR, selector)
    driver.execute_script("arguments[0].click()", element)
    return element

try:
    driver.get(url)
    driver.execute_script("localStorage.clear()")
    driver.refresh()

    assert not driver.find_element(By.ID, "sourceExamShell").get_attribute("hidden")
    assert driver.find_element(By.ID, "quizShell").get_attribute("hidden") == "true"
    assert "Página 1" in driver.find_element(By.CSS_SELECTOR, ".source-exam-head strong").text
    assert len(driver.find_elements(By.CSS_SELECTOR, ".answer-row")) == 10
    assert "0 / 255" in driver.find_element(By.CSS_SELECTOR, ".global-source-progress").text
    assert len(driver.find_elements(By.CSS_SELECTOR, "#sourcePageJump option")) == 26

    click('[data-source-answer="1"][data-source-letter="A"]')
    click("#gradeSource")
    assert "1/10" in driver.find_element(By.CSS_SELECTOR, ".source-score strong").text
    assert len(driver.find_elements(By.CSS_SELECTOR, ".row-correct")) == 1

    click("#sourceExamNext")
    assert "Página 2" in driver.find_element(By.CSS_SELECTOR, ".source-exam-head strong").text
    assert len(driver.find_elements(By.CSS_SELECTOR, ".answer-row")) == 11

    click('[data-mode="cards"]')
    assert driver.find_element(By.ID, "studyFlashcard").is_displayed()
    first_term = driver.find_element(By.CSS_SELECTOR, ".study-flashcard h3").text
    click("#studyFlashcard")
    assert "revealed" in driver.find_element(By.ID, "studyFlashcard").get_attribute("class")
    click("#cardKnow")
    assert driver.find_element(By.CSS_SELECTOR, ".study-flashcard h3").text != first_term

    click('[data-mode="scenario"]')
    click('[data-scenario-choice="1"]')
    assert "Correcto" in driver.find_element(By.ID, "scenarioFeedback").text

    click('[data-practice="rapid"]')
    click("#startRapid")
    start = int(driver.find_element(By.ID, "rapidTime").text)
    time.sleep(2)
    end = int(driver.find_element(By.ID, "rapidTime").text)
    assert end < start

    click('[data-practice="custom"]')
    assert "253 respuestas verificadas" in driver.find_element(By.ID, "customExamShell").text
    click('[data-exam-size="10"]')
    assert "1 / 10" in driver.find_element(By.ID, "customExamShell").text
    click('[data-custom-answer="A"]')
    click("#customNext")
    assert "2 / 10" in driver.find_element(By.ID, "customExamShell").text

    assert len(driver.find_elements(By.CSS_SELECTOR, "#translationPageSelect option")) == 26
    assert "CONOCIMIENTOS" in driver.find_element(By.ID, "translatedPage").text

    print("PASS: 255-slot source exam, 253-key custom bank, Spanish reader, activities, and timer")
finally:
    driver.quit()
