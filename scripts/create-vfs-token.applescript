#!/usr/bin/osascript

-- This script is used to create a VFS token from an email address.

-- Inputs:
-- - email address

-- Binary requirements:
-- - jq (https://stedolan.github.io/jq/)
-- - security (https://developer.apple.com/library/archive/documentation/Security/Conceptual/keychainServConcepts/chapters/AboutKeychains.html)
-- - Contacts.app

-- Additional requirements:
-- - Having a password labeled "edit.natbienetre.fr" in macOS keychain.

on run(input)
    -- Get system language
    set systemLanguage to do shell script "defaults read -globalDomain AppleLanguages " & ¬
            "| awk '{if (NR == 2) print $0}' " & ¬
            "| jq -r . " & ¬
            "| cut -d'-' -f1"

    -- Get email address from Automator input
    if (count of input) is 0 then
        display dialog t("noEmailAddressProvided", systemLanguage) buttons {t("okButton", systemLanguage)} default button t("okButton", systemLanguage) with icon stop
        return
    end if
    set emailAddress to item 1 of input

    -- Search for contact in Contacts.app using the email address
    tell application "Contacts"
        -- Search for contacts with matching email
        set matchingPeople to (every person whose value of emails contains emailAddress)

        if (count of matchingPeople) is 0 then
            display dialog t("errorContactRetrieval", systemLanguage) & emailAddress buttons {t("okButton", systemLanguage)} default button t("okButton", systemLanguage) with icon stop
            return
        end if

        -- Get the first matching contact
        set selectedPerson to item 1 of matchingPeople
    end tell

    -- Get WordPress credentials from macOS Passwords.app
    try
        set wpUsername to do shell script "security find-generic-password -l 'edit.natbienetre.fr' " & ¬
            "| grep 'acct' " & ¬
            "| cut -d'=' -f2 " & ¬
            "| jq -r ."
        set wpPassword to do shell script "security find-generic-password -a " & quoted form of wpUsername & " -l 'edit.natbienetre.fr' -w"
        set wpUrl to do shell script "security find-generic-password -a " & quoted form of wpUsername & " -l 'edit.natbienetre.fr' " & ¬
            "| grep 'svce' " & ¬
            "| cut -d'=' -f2 " & ¬
            "| jq -r ."
    on error errMsg
        display dialog t("errorCredentialsRetrieval", systemLanguage) & errMsg buttons {t("okButton", systemLanguage)} default button t("okButton", systemLanguage) with icon stop
        return
    end try

    set credentials to wpUsername & ":" & wpPassword

    -- Get contact information
    set displayName to name of selectedPerson

    -- Prepare the token creation data
    set tokenData to do shell script "jq -n '{
        \"user\": {
            \"id\": $email,
            \"displayName\": $displayName,
            \"email\": $email
        },
        \"permissions\": [
            \"read\",
            \"write\"
        ]
    }'" & ¬
    " --arg displayName " & quoted form of displayName & ¬
    " --arg email " & quoted form of emailAddress
    -- Call the WordPress API to create the token
    try
        set tokenResult to do shell script "curl -fsLX POST " & wpUrl & "/wp-json/vfs/v1/tokens " & ¬
            "-H 'Content-Type: application/json' " & ¬
            "--user " & quoted form of credentials & " " & ¬
            "-d '" & tokenData & "'" & ¬
            " | jq -r '.token'"
    on error errMsg
        display dialog t("errorTokenCreation", systemLanguage) & errMsg buttons {t("okButton", systemLanguage)} default button t("okButton", systemLanguage) with icon stop
        return
    end try

    set landingPage to "https://natbienetre.fr/mes-documents?vfs_token=" & tokenResult

    -- Copy the url to the clipboard
    set the clipboard to landingPage

    -- Display the notification
    display dialog t("tokenCopied", systemLanguage) buttons {t("okButton", systemLanguage)} default button t("okButton", systemLanguage)
end run

-- Helper function to pad numbers with leading zeros
on padNumber(n)
    if n < 10 then
        return "0" & n
    else
        return n as string
    end if
end padNumber

-- Helper function to get localized text
on t(text, lang)
    if lang is "fr" then
        if text is "tokenCopied" then
            return "L'URL pour " & contactName & " a été copiée dans le presse-papiers."
        else if text is "okButton" then
            return "OK"
        else if text is "errorTokenCreation" then
            return "Erreur lors de la création de l'URL : "
        else if text is "errorCredentialsRetrieval" then
            return "Erreur lors de la récupération des identifiants : "
        else if text is "errorContactRetrieval" then
            return "Erreur lors de la récupération du contact : "
        else if text is "noEmailAddressProvided" then
            return "Aucune adresse email fournie"
        end if
    else
        if text is "tokenCopied" then
            return "The URL for " & contactName & " has been copied to clipboard."
        else if text is "okButton" then
            return "OK"
        else if text is "errorTokenCreation" then
            return "Error creating token: "
        else if text is "errorCredentialsRetrieval" then
            return "Error retrieving credentials: "
        else if text is "errorContactRetrieval" then
            return "Error retrieving contact: "
        else if text is "noEmailAddressProvided" then
            return "No email address provided"
        end if
    end if
end t
