// frontend/src/features/chits/components/ui/ChitDesktopActionButton.jsx

import PropTypes from "prop-types";
import { Loader2, Plus, SquarePen } from "lucide-react";
import Button from "../../../../components/ui/Button";

/**
 * ChitDesktopActionButton component - renders the create/update button for desktop view.
 *
 * @param {object} props - Component props
 * @param {string} props.mode - Current mode: "create", "edit", or "view"
 * @param {boolean} props.loading - Whether form is submitting
 * @param {boolean} props.isPostCreation - Whether in post-creation state (chit created, adding details)
 */
const ChitDesktopActionButton = ({ mode, loading, isPostCreation }) => {
    if (mode === "view") return null;

    let buttonText, Icon, buttonVariant;

    if (mode === "create") {
        if (isPostCreation) {
            buttonText = "Update Chit";
            Icon = SquarePen;
            buttonVariant = "warning";
        } else {
            buttonText = "Create Chit";
            Icon = Plus;
            buttonVariant = "success";
        }
    } else {
        buttonText = "Update Chit";
        Icon = SquarePen;
        buttonVariant = "warning";
    }

    return (
        <div className="md:col-start-2 md:flex md:justify-end">
            <Button
                type="submit"
                form="chit-details-form-desktop"
                variant={buttonVariant}
                disabled={loading}
                className="w-full md:w-auto"
            >
                {loading ? (
                    <Loader2 className="animate-spin mx-auto w-5 h-5" />
                ) : (
                    <>
                        <Icon className="inline-block mr-2 w-5 h-5" />
                        {buttonText}
                    </>
                )}
            </Button>
        </div>
    );
};

ChitDesktopActionButton.propTypes = {
    mode: PropTypes.oneOf(["create", "edit", "view"]).isRequired,
    loading: PropTypes.bool.isRequired,
    isPostCreation: PropTypes.bool.isRequired,
};

export default ChitDesktopActionButton;
